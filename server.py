import os
from typing import Optional, Literal
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials  # type: ignore
import boto3
from botocore.exceptions import ClientError

app = FastAPI()

clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

USE_DYNAMODB = os.getenv("USE_DYNAMODB", "false").lower() == "true"

# CORS: read from Secrets Manager in production, env var locally
if USE_DYNAMODB:
    from aws_secrets import get_secret
    config = get_secret(os.getenv("SECRET_NAME", "job-coach/config-dev"))
    cors_origins = config.get("CORS_ORIGINS", "http://localhost:3000").split(",")
else:
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class InputRecord(BaseModel):
    job_title: str = Field(..., min_length=2, max_length=200)
    job_description: str = Field(..., min_length=50)
    resume_text: str = Field(..., min_length=50)
    experience_level: Literal["Entry", "Mid", "Senior", "Executive"]
    target_company: str = Field(..., min_length=1, max_length=200)
    session_id: Optional[str] = None


system_prompt = """
You are an expert career coach and professional resume writer with 15 years of experience helping candidates land roles at top companies. You specialise in tailoring application materials to specific job descriptions, optimising for Applicant Tracking Systems (ATS), and preparing candidates for behavioural and technical interviews.

Your task is to analyse the candidate's resume and the target job description, then produce three clearly structured output sections. Each section must use the exact Markdown heading shown below so that the frontend can render them correctly.

## Tailored Resume Bullets
Rewrite or generate 5-8 strong, ATS-optimised bullet points the candidate should use on their resume for this specific role. Each bullet must:
- Begin with a powerful action verb (Engineered, Led, Optimised, Delivered, etc.)
- Quantify impact wherever possible (percentages, dollar amounts, time saved, team size)
- Mirror the exact language and keywords used in the job description
- Be written in past tense (for previous roles) or present tense (for current roles)
Tone: professional, concise, achievement-focused.

## Cover Letter Draft
Write a complete, professional cover letter (3-4 paragraphs) addressed to the hiring team at the target company. The letter must:
- Open with a compelling hook that references the specific role and company
- Connect 2-3 of the candidate's strongest achievements directly to the company's stated needs
- Close with a confident, specific call to action
- Match the candidate's experience level in tone (Entry: enthusiastic learner; Mid: proven contributor; Senior/Executive: strategic leader)
Do not include placeholder text like [Your Name] - write as if this is the final draft ready to send.
Tone: professional, warm, confident.

## Interview Preparation Tips
Provide 5 targeted preparation tips specific to this role and company, including:
- 2-3 behavioural questions the interviewer is likely to ask, with a brief outline of a strong answer using the STAR framework
- 1-2 technical or domain-specific questions based on the job description
- 1 tip on researching the company's recent news, products, or values before the interview
Tone: coaching, encouraging, practical.

Constraint rules:
- Do not invent qualifications, degrees, or experience the candidate has not mentioned in their resume.
- Do not use generic filler phrases such as "detail-oriented", "team player", or "passionate about" unless they appear in the job description.
- Always address the specific company and role - never produce generic output.
- If the resume lacks information to answer a section fully, note the gap and suggest what the candidate should add.
"""


def user_prompt_for(record: InputRecord) -> str:
    return f"""Please analyse this job application and produce the three structured sections.

Job Title: {record.job_title}
Target Company: {record.target_company}
Experience Level: {record.experience_level}

--- JOB DESCRIPTION START ---
{record.job_description}
--- JOB DESCRIPTION END ---

--- RESUME START ---
{record.resume_text}
--- RESUME END ---

Produce all three sections now: Tailored Resume Bullets, Cover Letter Draft, and Interview Preparation Tips.
"""


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0"}


@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    session_id = record.session_id if record.session_id else user_id

    # Load conversation history from DynamoDB if enabled
    conversation = []
    if USE_DYNAMODB:
        from dynamo_memory import load_conversation, save_conversation
        conversation = load_conversation(session_id)

    # Call AWS Bedrock
    bedrock = boto3.client(
        service_name="bedrock-runtime",
        region_name=os.getenv("BEDROCK_REGION", "us-east-2")
    )

    model_id = os.getenv("BEDROCK_MODEL_ID", "global.amazon.nova-2-lite-v1:0")
    user_message = user_prompt_for(record)

    try:
        response = bedrock.converse(
            modelId=model_id,
            system=[{"text": system_prompt}],
            messages=[{"role": "user", "content": [{"text": user_message}]}],
        )
        assistant_response = response["output"]["message"]["content"][0]["text"]
    except ClientError as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Bedrock error: {str(e)}"}
        )

    # Save conversation history
    if USE_DYNAMODB:
        conversation.append({"role": "user", "content": user_message})
        conversation.append({"role": "assistant", "content": assistant_response})
        save_conversation(session_id, conversation)

    return {"response": assistant_response, "session_id": session_id}
