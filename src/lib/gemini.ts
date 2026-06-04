export interface ExtractedDocumentDetails {
  name: string;
  nic: string;
  address: string;
}

export async function extractDocumentDetails(
  docType: 'nic' | 'dl',
  isOldNic: boolean,
  frontBase64: string,
  backBase64: string
): Promise<ExtractedDocumentDetails> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  
  // Clean base64 strings (remove "data:image/jpeg;base64," prefix if present)
  const cleanFront = frontBase64.replace(/^data:image\/[a-z]+;base64,/, '');
  const cleanBack = backBase64 ? backBase64.replace(/^data:image\/[a-z]+;base64,/, '') : '';
  
  let prompt = '';
  if (docType === 'dl') {
    prompt = `
Extract the details from this Driving License front photo.
Return a JSON object containing the following fields:
- "name": Cardholder's full name in English (properly formatted capital case, spelling checked).
- "nic": Driving license number / identity card number listed on the front.
- "address": Resident address in English (neatly formatted, remove line breaks and labels like 'Address:', format with commas).

Return ONLY the raw JSON object. Do not wrap in markdown or code blocks.
`;
  } else if (isOldNic) {
    prompt = `
Extract the details from this Sri Lankan Old National Identity Card (paper-laminated card).
Note: The NIC number is on the FRONT photo. The cardholder's Name and Resident Address are on the BACK photo.
Return a JSON object containing the following fields:
- "name": Cardholder's full name in English (properly formatted capital case, spelling checked).
- "nic": Identity card number (e.g. 9 digits ending with V/X, or 12 digits). Make sure to extract this from the FRONT photo.
- "address": Resident address in English (neatly formatted, remove line breaks and labels like 'Address:', format with commas). Make sure to extract this from the BACK photo.

Return ONLY the raw JSON object. Do not wrap in markdown or code blocks.
`;
  } else {
    prompt = `
Extract the details from this National Identity Card (NIC) front and back photo.
Return a JSON object containing the following fields:
- "name": Cardholder's full name in English (properly formatted capital case, spelling checked).
- "nic": Identity card number (e.g. 9 digits ending with V/X, or 12 digits). Verify from both front and back.
- "address": Resident address in English (neatly formatted, remove line breaks and labels like 'Address:', format with commas).

Return ONLY the raw JSON object. Do not wrap in markdown or code blocks.
`;
  }

  const parts: any[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanFront
      }
    }
  ];

  if (docType === 'nic' && cleanBack) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanBack
      }
    });
  }
  
  const payload = {
    contents: [
      {
        parts
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  // We try gemini-2.5-flash as requested by user, with fallback to gemini-2.0-flash / gemini-1.5-flash
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Attempting OCR extraction using model: ${model}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Model ${model} returned status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`Model ${model} returned an empty response`);
      }

      console.log(`Raw Gemini response from ${model}:`, text);
      const parsed: ExtractedDocumentDetails = JSON.parse(text.trim());
      
      return {
        name: parsed.name || '',
        nic: parsed.nic || '',
        address: parsed.address || ''
      };
    } catch (err) {
      console.warn(`Model ${model} failed:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to extract details from document images using any available Gemini model");
}
