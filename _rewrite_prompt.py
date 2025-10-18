import re
from pathlib import Path

path = Path("web-app/src/pages/OneOnOnePage.tsx")
text = path.read_text(encoding='utf-8', errors='ignore')
pattern = r"    try \{\s*const prompt = [\s\S]*?const text = result\.response\.text\(\);"
replacement = "    try {\n      const promptLines = [\n        'Summarize the following 1on1 conversation for an HR business context.',\n        '',\n        '[Key Takeaways]',\n        '- Provide three concise bullet points.',\n        '',\n        '[Next Actions]',\n        '- List specific actionable next steps. If none, respond with \"none\".',\n        '',\n        '---',\n        'Transcript:',\n        editableTranscript,\n      ];\n\n      const { text } = await callGeminiProxy(promptLines.join('\\n'), {\n        modelOverride: SUMMARY_MODEL_OVERRIDE,\n      });"
new_text, count = re.subn(pattern, replacement, text, count=1)
if count == 0:
    raise SystemExit('prompt block not replaced')
path.write_text(new_text, encoding='utf-8')
