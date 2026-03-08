from pypdf import PdfReader
reader = PdfReader(r"d:\Projects\CleanML\CleanML_Development_Strategy.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"
with open(r"d:\Projects\CleanML\strategy.txt", "w", encoding="utf-8") as f:
    f.write(text)
