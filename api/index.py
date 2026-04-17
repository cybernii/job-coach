import os
from typing import Optional, Literal
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials  # type: ignore
from openai import OpenAI

app = FastAPI()

clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)


@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "healthy", "version": "1.0"}


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


@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt_for(record)},
    ]
    stream = client.chat.completions.create(
        model="gpt-4o-mini", messages=messages, stream=True
    )

    def event_stream():
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                lines = text.split("\n")
                for line in lines[:-1]:
                    yield f"data: {line}\n\n"
                    yield "data:  \n"
                yield f"data: {lines[-1]}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
