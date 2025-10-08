from setuptools import setup, find_packages

setup(
    name="jobstalker-backend",
    version="1.0.0",
    description="JobStalker FastAPI Backend",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.116.1",
        "uvicorn[standard]>=0.35.0",
        "python-multipart>=0.0.9",
        "supabase>=2.17.0",
        "openai>=1.0.0",
        "requests>=2.31.0",
        "beautifulsoup4>=4.12.0",
        "python-dotenv>=1.1.1",
        "pydantic>=2.11.7",
        "langchain>=0.3.26",
    ],
    python_requires=">=3.12",
)
