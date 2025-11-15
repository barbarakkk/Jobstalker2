"""Job data extraction utilities using AI and basic parsing"""
import hashlib
import re
import json
from bs4 import BeautifulSoup
from utils.openai_client import get_openai_client

# Debug persistence disabled for production
def save_state_data(state_name: str, data: dict, user_id: str = None, job_url: str = None):
    return None

def save_html_content(html_content: str, user_id: str, job_url: str, stage: str = "raw_html"):
    return None

def save_cleaned_content(cleaned_text: str, user_id: str, job_url: str, stage: str = "cleaned_text"):
    return None

def extract_job_data_with_ai(html: str, source_url: str) -> dict:
    """Extract job data from HTML using OpenAI"""
    try:
        print(f"🤖 AI EXTRACTION: Starting AI job data extraction...")
        print(f"🤖 AI EXTRACTION: Source URL: {source_url}")
        print(f"🤖 AI EXTRACTION: HTML content length: {len(html)}")
        
        # Create a hash for this extraction session
        extraction_id = hashlib.md5(f"{source_url}_{len(html)}".encode()).hexdigest()[:8]
        
        # Save AI extraction start state
        save_state_data(f"ai_extraction_start_{extraction_id}", {
            "source_url": source_url,
            "html_length": len(html),
            "extraction_id": extraction_id
        })
        
        client = get_openai_client()
        print(f"🤖 AI EXTRACTION: OpenAI client initialized")
        
        # Use BeautifulSoup for better HTML parsing
        soup = BeautifulSoup(html, 'html.parser')
        print(f"🤖 AI EXTRACTION: HTML parsed with BeautifulSoup")
        
        # Remove unwanted elements but keep job content
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            element.decompose()
        print(f"🤖 AI EXTRACTION: Removed unwanted HTML elements")
        
        # Try to find the main job content area
        job_content = soup.find('main') or soup.find('div', class_=lambda x: x and 'job' in x.lower()) or soup
        print(f"🤖 AI EXTRACTION: Found job content area")
        
        # Get text content with some structure preserved
        text_content = job_content.get_text(separator='\n', strip=True)
        print(f"🤖 AI EXTRACTION: Extracted text content length: {len(text_content)}")
        
        # Save parsed content
        save_cleaned_content(text_content, "ai_extraction", source_url, f"ai_parsed_content_{extraction_id}")
        
        # Extract structured job data first
        job_elements = []
        
        # Look for common job posting selectors with more specific targeting
        title_selectors = [
            'h1[class*="job-title"]',
            'h1[class*="jobs-unified-top-card__job-title"]',
            'h1[class*="jobs-details-top-card__job-title"]',
            '[data-testid*="job-title"]',
            '.job-title',
            '.jobs-unified-top-card__job-title',
            '.jobs-details-top-card__job-title',
            'h1'
        ]
        
        company_selectors = [
            '[data-testid*="company"]',
            '.company-name',
            '.jobs-unified-top-card__company-name',
            '.jobs-details-top-card__company-name',
            'a[class*="company"]'
        ]
        
        location_selectors = [
            '[data-testid*="location"]',
            '.job-location',
            '.jobs-unified-top-card__bullet',
            '.jobs-details-top-card__bullet',
            'span[class*="location"]'
        ]
        
        salary_selectors = [
            '[data-testid*="salary"]',
            '[data-testid*="compensation"]',
            '.salary',
            '.compensation',
            '.jobs-unified-top-card__salary',
            '.jobs-details-top-card__salary',
            '.job-details-jobs-unified-top-card__salary',
            '.job-salary',
            '.pay-range',
            '.salary-range',
            '.compensation-range',
            '.job-pay',
            '.wage',
            '.remuneration',
            '.job-details__salary',
            '.jobs-unified-top-card__primary-description',
            '.jobs-unified-top-card__subtitle-primary-grouping',
            '.jobs-details__main-content .salary',
            '.jobs-details__main-content .compensation',
            'span[class*="salary"]',
            'div[class*="salary"]',
            'span[class*="compensation"]',
            'div[class*="compensation"]',
            'span[class*="pay"]',
            'div[class*="pay"]',
            'span[class*="wage"]',
            'div[class*="wage"]'
        ]
        
        # Extract job title
        job_title = "Unknown Job Title"
        for selector in title_selectors:
            elements = soup.select(selector)
            if elements:
                title_text = elements[0].get_text(strip=True)
                if title_text and len(title_text) > 3:  # Valid title
                    job_title = title_text
                    job_elements.append(f"Job Title: {title_text}")
                    break
        
        # Extract company
        company = "Unknown Company"
        for selector in company_selectors:
            elements = soup.select(selector)
            if elements:
                company_text = elements[0].get_text(strip=True)
                if company_text and len(company_text) > 1:  # Valid company
                    company = company_text
                    job_elements.append(f"Company: {company_text}")
                    break
        
        # Extract location
        location = "Unknown Location"
        for selector in location_selectors:
            elements = soup.select(selector)
            if elements:
                location_text = elements[0].get_text(strip=True)
                if location_text and len(location_text) > 2:  # Valid location
                    location = location_text
                    job_elements.append(f"Location: {location_text}")
                    break
        
        # Extract salary
        salary = None
        for selector in salary_selectors:
            elements = soup.select(selector)
            if elements:
                salary_text = elements[0].get_text(strip=True)
                if salary_text and len(salary_text) > 3:  # Valid salary
                    salary = salary_text
                    job_elements.append(f"Salary: {salary_text}")
                    break
        
        # If no salary found via selectors, try regex patterns
        if not salary:
            salary_regex_patterns = [
                r'\$[\d,]+(?:\.\d{2})?\s*(?:-\s*\$?[\d,]+(?:\.\d{2})?)?\s*(?:per\s+(?:year|month|hour|week))?',
                r'\$[\d,]+(?:\.\d{2})?\s*(?:to\s*\$?[\d,]+(?:\.\d{2})?)?\s*(?:per\s+(?:year|month|hour|week))?',
                r'\$[\d,]+(?:\.\d{2})?\s*(?:-\s*\$?[\d,]+(?:\.\d{2})?)?\s*(?:annually|monthly|hourly|weekly)',
                r'\$[\d,]+(?:\.\d{2})?\s*(?:to\s*\$?[\d,]+(?:\.\d{2})?)?\s*(?:annually|monthly|hourly|weekly)',
                r'(?:salary|pay|compensation|wage):\s*\$?[\d,]+(?:\.\d{2})?(?:\s*-\s*\$?[\d,]+(?:\.\d{2})?)?',
                r'\$[\d,]+(?:\.\d{2})?\s*(?:k|K)\s*(?:per\s+(?:year|month|hour|week))?',
                r'\$[\d,]+(?:\.\d{2})?\s*(?:k|K)\s*(?:annually|monthly|hourly|weekly)'
            ]
            
            for pattern in salary_regex_patterns:
                matches = re.findall(pattern, text_content, re.IGNORECASE)
                if matches:
                    # Find the most complete salary match
                    best_match = None
                    for match in matches:
                        if '$' in match and any(keyword in match.lower() for keyword in ['per', 'annually', 'monthly', 'hourly', 'weekly', 'k']):
                            best_match = match
                            break
                    
                    if best_match:
                        salary = best_match.strip()
                        job_elements.append(f"Salary: {salary}")
                        print(f"🤖 AI EXTRACTION: Found salary via regex: {salary}")
                        break
        
        # Get job description - look for the main description area
        description_selectors = [
            '.jobs-description-content__text',
            '.jobs-box__html-content',
            '.jobs-details__main-content',
            '[data-testid*="job-details"]',
            '.job-description',
            '.description'
        ]
        
        job_description = ""
        for selector in description_selectors:
            elements = soup.select(selector)
            if elements:
                desc_text = elements[0].get_text(separator='\n', strip=True)
                if desc_text and len(desc_text) > 50:  # Valid description
                    job_description = desc_text
                    job_elements.append(f"Description: {desc_text[:200]}...")
                    break
        
        # Combine structured elements with focused text content
        # Only use the first 5000 characters of the full text to avoid noise
        focused_text = text_content[:5000] if text_content else ""
        combined_content = '\n'.join(job_elements) + '\n\n' + focused_text
        print(f"🤖 AI EXTRACTION: Combined content length: {len(combined_content)}")
        
        # Save combined content for AI
        save_cleaned_content(combined_content, "ai_extraction", source_url, f"ai_combined_content_{extraction_id}")
        
        # Save AI extraction preparation state
        save_state_data(f"ai_extraction_prepared_{extraction_id}", {
            "extraction_id": extraction_id,
            "text_content_length": len(text_content),
            "combined_content_length": len(combined_content),
            "job_elements_found": job_elements
        })
        
        print(f"🤖 AI EXTRACTION: Sending content to OpenAI GPT-4...")
        
        prompt = f"""
        You are an expert at extracting job information from LinkedIn job postings. 
        
        IMPORTANT: The content below has been pre-processed to focus on job-related information. 
        Use the structured data provided and enhance it with additional details from the content.
        
        PRE-EXTRACTED DATA:
        Job Title: {job_title}
        Company: {company}
        Location: {location}
        Salary: {salary if salary else "Not specified"}
        Description: {job_description[:300] + "..." if len(job_description) > 300 else job_description}
        
        Return ONLY a valid JSON object with this structure:
        {{
            "job_title": "string - use the pre-extracted title or extract from content",
            "company": "string - use the pre-extracted company or extract from content", 
            "location": "string - use the pre-extracted location or extract from content",
            "salary": "string or null - use the pre-extracted salary or extract from content",
            "description": "string - use the pre-extracted description or extract from content",
            "job_type": "string (e.g., Full-time, Part-time, Contract) - extract from content",
            "experience_level": "string (e.g., Entry level, Mid-level, Senior) - extract from content",
            "remote_work": "boolean - true if remote work is mentioned",
            "benefits": "array of strings - benefits mentioned in content",
            "requirements": "array of strings - job requirements from content",
            "skills": "array of strings - required skills from content"
        }}
        
        CONTENT TO ANALYZE (focused job content):
        {combined_content}
        
        SOURCE URL: {source_url}
        
        EXTRACTION RULES:
        1. Use the pre-extracted data as your primary source
        2. Enhance with additional details from the content
        3. Look for job type, experience level, remote work, benefits, requirements, and skills
        4. For salary: Look for patterns like "$50,000 - $70,000 per year", "$60k annually", "Salary: $45,000", etc.
        5. If content appears to be a login page or not a job posting, return all fields as "Unknown"
        6. Return ONLY valid JSON, no other text
        7. Focus on the job posting content, ignore navigation elements
        8. Pay special attention to salary information in job descriptions and requirements sections
        
        Return the JSON object now:
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert at extracting job information from HTML. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.1
        )
        
        print(f"🤖 AI EXTRACTION: OpenAI API call completed")
        
        # Save AI API call state
        save_state_data(f"ai_api_call_{extraction_id}", {
            "extraction_id": extraction_id,
            "model": "gpt-4o-mini",
            "max_tokens": 2000,
            "temperature": 0.1,
            "prompt_length": len(prompt)
        })
        
        # Parse the response
        content = response.choices[0].message.content.strip()
        print(f"🤖 AI EXTRACTION: OpenAI raw response: {content}")
        
        # Save AI response
        save_cleaned_content(content, "ai_extraction", source_url, f"ai_response_{extraction_id}")
        
        # Extract JSON from response (in case there's extra text)
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            extracted_data = json.loads(json_match.group())
            print(f"🤖 AI EXTRACTION: Successfully parsed JSON data: {extracted_data}")
            
            # Save successful extraction result
            save_state_data(f"ai_extraction_success_{extraction_id}", {
                "extraction_id": extraction_id,
                "extracted_data": extracted_data,
                "success": True
            })
            
            return extracted_data
        else:
            print(f"❌ AI EXTRACTION: No JSON found in OpenAI response")
            
            # Save failed extraction result
            save_state_data(f"ai_extraction_failed_{extraction_id}", {
                "extraction_id": extraction_id,
                "raw_response": content,
                "error": "No JSON found in OpenAI response",
                "success": False
            })
            
            raise ValueError("No JSON found in OpenAI response")
            
    except Exception as e:
        print(f"❌ AI EXTRACTION: OpenAI extraction error: {str(e)}")
        print(f"🤖 AI EXTRACTION: Falling back to basic extraction...")
        
        # Save AI extraction error state
        save_state_data(f"ai_extraction_error_{extraction_id}", {
            "extraction_id": extraction_id,
            "error_type": "Exception",
            "error_message": str(e),
            "falling_back_to_basic": True
        })
        
        # Fallback to basic extraction
        return extract_job_data_basic(html)

def extract_job_data_basic(html: str) -> dict:
    """Basic job data extraction without AI (fallback)"""
    print(f"🔧 BASIC EXTRACTION: Starting basic job data extraction...")
    
    # Create extraction ID for basic extraction
    basic_extraction_id = hashlib.md5(f"basic_{len(html)}".encode()).hexdigest()[:8]
    
    # Save basic extraction start state
    save_state_data(f"basic_extraction_start_{basic_extraction_id}", {
        "extraction_id": basic_extraction_id,
        "html_length": len(html),
        "extraction_type": "basic"
    })
    
    # More comprehensive regex patterns for LinkedIn job postings
    title_patterns = [
        r'<h1[^>]*class="[^"]*job-title[^"]*"[^>]*>(.*?)</h1>',
        r'<h1[^>]*class="[^"]*jobs-unified-top-card__job-title[^"]*"[^>]*>(.*?)</h1>',
        r'<h1[^>]*class="[^"]*jobs-details-top-card__job-title[^"]*"[^>]*>(.*?)</h1>',
        r'<h1[^>]*>(.*?)</h1>'
    ]
    print(f"🔧 BASIC EXTRACTION: Using {len(title_patterns)} title patterns")
    
    company_patterns = [
        r'<a[^>]*class="[^"]*company-name[^"]*"[^>]*>(.*?)</a>',
        r'<a[^>]*class="[^"]*jobs-unified-top-card__company-name[^"]*"[^>]*>(.*?)</a>',
        r'<a[^>]*class="[^"]*jobs-details-top-card__company-name[^"]*"[^>]*>(.*?)</a>'
    ]
    
    location_patterns = [
        r'<span[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)</span>',
        r'<span[^>]*class="[^"]*jobs-unified-top-card__bullet[^"]*"[^>]*>(.*?)</span>',
        r'<span[^>]*class="[^"]*jobs-details-top-card__bullet[^"]*"[^>]*>(.*?)</span>'
    ]
    
    def clean_text(text):
        if not text:
            return None
        return re.sub(r'<[^>]+>', '', text).strip()
    
    def extract_with_patterns(patterns):
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            if match:
                return clean_text(match.group(1))
        return None
    
    # Extract job title
    print(f"🔧 BASIC EXTRACTION: Extracting job title...")
    job_title = extract_with_patterns(title_patterns)
    if not job_title:
        # Fallback: look for any h1 tag
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        job_title = clean_text(h1_match.group(1)) if h1_match else "Unknown Job Title"
    print(f"🔧 BASIC EXTRACTION: Job title found: {job_title}")
    
    # Extract company
    print(f"🔧 BASIC EXTRACTION: Extracting company name...")
    company = extract_with_patterns(company_patterns)
    if not company:
        company = "Unknown Company"
    print(f"🔧 BASIC EXTRACTION: Company found: {company}")
    
    # Extract location
    print(f"🔧 BASIC EXTRACTION: Extracting location...")
    location = extract_with_patterns(location_patterns)
    print(f"🔧 BASIC EXTRACTION: Location found: {location}")
    
    print(f"🔧 BASIC EXTRACTION: Basic extraction complete - Title: {job_title}, Company: {company}, Location: {location}")
    
    # Prepare result data
    result_data = {
        "job_title": job_title,
        "company": company,
        "location": location,
        "salary": None,
        "description": None,
        "job_type": None,
        "experience_level": None,
        "remote_work": False,
        "benefits": [],
        "requirements": [],
        "skills": []
    }
    
    # Save basic extraction result
    save_state_data(f"basic_extraction_result_{basic_extraction_id}", {
        "extraction_id": basic_extraction_id,
        "extracted_data": result_data,
        "success": True
    })
    
    return result_data

def check_duplicate_job(user_id: str, source_url: str) -> bool:
    """Check if job already exists for user"""
    try:
        from supabase_client import supabase
        response = supabase.table("jobs").select("id").eq("user_id", user_id).eq("job_url", source_url).execute()
        is_duplicate = len(response.data) > 0
        return is_duplicate
    except Exception as e:
        print(f"❌ DUPLICATE CHECK: Error checking duplicate: {str(e)}")
        return False

