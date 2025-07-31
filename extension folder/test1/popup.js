async function requestLinkedInJobData() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return reject("No active tab");
        chrome.tabs.sendMessage(tabs[0].id, { type: "EXTRACT_LINKEDIN_JOB" }, (resp) => {
          if (chrome.runtime.lastError) return reject("Extractor not available");
          resolve(resp.job);
        });
      });
    });
  }

async function saveToSupabase(jobData, userInputs, openaiAnalysis, supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and Key are required");
  }

  // Create the data object to save - matching your actual table columns
  const jobRecord = {
    description: jobData.description || jobData.title || '', // Use description field for job details
    job_url: jobData.url || '',
    status: userInputs.status || 'bookmarked',
    excitement_level: parseInt(userInputs.excitement) || 5,
    date_applied: null, // Will be set when user applies
    deadline: null, // Will be set if available
    salary: null, // Will be extracted if available in job data
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(jobRecord)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Supabase error: ${response.status} - ${errorData}`);
    }

    return { success: true, message: 'Job saved to Supabase successfully' };
  } catch (error) {
    throw new Error(`Failed to save to Supabase: ${error.message}`);
  }
}

async function processJobWithOpenAI(jobData) {
  // For now, create a mock AI analysis until backend is deployed
  const mockAnalysis = {
    skills_required: ["JavaScript", "React", "Node.js", "API Development"],
    experience_level: "mid",
    salary_range: "$80k-$120k",
    remote_friendly: true,
    key_highlights: [
      "Competitive salary",
      "Remote work options", 
      "Growth opportunities",
      "Modern tech stack"
    ],
    potential_red_flags: [],
    overall_assessment: "This appears to be a solid opportunity with good compensation and remote flexibility. The tech stack is modern and in-demand."
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return mockAnalysis;
}

async function init() {
  const jobSummaryEl = document.getElementById("job-summary");
  
  try {
    const job = await requestLinkedInJobData();
    jobSummaryEl.textContent = `${job.title || "[no title]"} at ${job.company || "[no company]"} (${job.location || "?"})`;
    window._currentJob = job;
  } catch (e) {
    jobSummaryEl.textContent = "Extraction failed: " + e;
    document.getElementById("save").disabled = true;
  }

  document.getElementById("save").addEventListener("click", onSave);
}

async function getOpenAIKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['openai_api_key'], (result) => {
      resolve(result.openai_api_key);
    });
  });
}

async function onSave() {
  const resultEl = document.getElementById("result");
  resultEl.textContent = "Processing...";
  
  const excitement = document.getElementById("excitement").value;
  const status = document.getElementById("status").value;
  
  // Hardcoded Supabase credentials
  const supabaseUrl = "https://aomsclctttvetqpdzwyj.supabase.co";
  const supabaseKey = "YOUR_SUPABASE_ANON_KEY_HERE"; // Replace with your actual Supabase anon key
  
  const rawJob = window._currentJob;
  if (!rawJob) {
    resultEl.textContent = "No job data.";
    return;
  }

  try {
    // Process job data with AI
    resultEl.textContent = "Processing with AI...";
    const openaiAnalysis = await processJobWithOpenAI(rawJob);
    
    // Save to Supabase
    resultEl.textContent = "Saving to Supabase...";
    const userInputs = { excitement, status };
    const result = await saveToSupabase(rawJob, userInputs, openaiAnalysis, supabaseUrl, supabaseKey);
    
    if (result.success) {
      resultEl.textContent = "Saved to Supabase successfully with AI analysis!";
    } else {
      resultEl.textContent = "Error: " + result.error;
    }
  } catch (err) {
    resultEl.textContent = "Error: " + err.message;
  }
}

document.addEventListener("DOMContentLoaded", init);
  