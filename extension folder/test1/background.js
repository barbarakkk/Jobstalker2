// Utility: call OpenAI to structure the raw job data
async function callOpenAI(openaiKey, rawJob) {
    const systemPrompt = `
  You are a data normalizer for job postings. Given raw extracted text and fields from a LinkedIn job posting, output a JSON object with the following keys:
  - id: a stable identifier (if job_id exists use that, otherwise generate a short UUID-like string)
  - job_url: canonical URL
  - status: (to be filled later, user input will override)
  - date_saved: ISO timestamp of now
  - date_applied: if any inference is possible else null
  - deadline: parse any deadline from text if present, else null
  - title: job title
  - company: company name
  - location: location
  Use null for missing optional fields. Return only the JSON object (no explanation).
  `;
  
    const userPrompt = `Raw job data:\n${JSON.stringify(rawJob, null, 2)}`;
  
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });
  
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error("OpenAI error: " + txt);
    }
  
    const data = await resp.json();
    const content = data.choices[0].message.content;
    try {
      // Attempt to extract JSON from response
      const parsed = JSON.parse(content.trim());
      return parsed;
    } catch (e) {
      // fallback: try to locate first JSON substring
      const m = content.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      throw new Error("Failed to parse OpenAI output: " + content);
    }
  }
  
  // Utility: save to Supabase (assumes table named 'jobs' with appropriate columns)
  async function saveToSupabase(supabaseUrl, supabaseKey, record) {
    const res = await fetch(`${supabaseUrl}/rest/v1/jobs`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(record)
    });
  
    if (!res.ok) {
      const body = await res.text();
      throw new Error("Supabase error: " + body);
    }
    return await res.json();
  }
  
  // Message handler
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "PROCESS_AND_SAVE") {
      (async () => {
        try {
          const {
            rawJob,
            userInputs: { excitement, status, notes },
            openaiKey,
            supabaseUrl,
            supabaseKey
          } = msg.payload;
  
          // Step 1: normalize via OpenAI
          const normalized = await callOpenAI(openaiKey, rawJob);
  
          // Build final record, merging user inputs
          const now = new Date().toISOString();
          const record = {
            id: normalized.id || (normalized.job_id || Math.random().toString(36).slice(2)),
            job_url: normalized.job_url || rawJob.job_url,
            status: status,
            date_saved: now,
            date_applied: normalized.date_applied || null,
            deadline: normalized.deadline || null,
            excitement: parseInt(excitement, 10),
            notes: notes || "",
            title: normalized.title || rawJob.title || null,
            company: normalized.company || rawJob.company || null,
            location: normalized.location || rawJob.location || null
          };
  
          // Persist to Supabase
          await saveToSupabase(supabaseUrl, supabaseKey, record);
          sendResponse({ success: true });
        } catch (err) {
          console.error("PROCESS_AND_SAVE failed:", err);
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true; // async
    }
  });
  