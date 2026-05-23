import json
import re
from pathlib import Path

from pypdf import PdfReader


PDF_PATH = Path(r"C:\Users\User\Downloads\HCI_Usability_OURSCHOOL-1-1.pdf")
OUT_PATH = Path(__file__).with_name("hci_usability_data.json")

TASKS = [
    "View offered subjects",
    "Navigate to Home page",
    "Login using credentials",
    "Attempt logout",
    "Return to login page",
    "Login again",
    "Open My Account",
    "Find Offered Subjects",
    "Navigate Clearance",
    "View account information",
]

SUS_QUESTIONS = [
    "Use frequently",
    "System unnecessarily complex",
    "Easy to use",
    "Need technical support",
    "Functions integrated",
    "Too much inconsistency",
    "Learn quickly",
    "System cumbersome",
    "Confident using system",
    "Need to learn before use",
]

QUAL_QUESTIONS = [
    "Most liked feature",
    "Suggested improvements",
    "Unnecessary feature",
    "Most frustrating part",
    "Design change suggestion",
    "Text readability",
    "Overall remarks",
]


def normalize_lines(text):
    return [re.sub(r"\s+", " ", line).strip() for line in text.splitlines() if line.strip()]


def after_label(lines, label, default=""):
    for i, line in enumerate(lines):
        if line == label:
            return lines[i + 1] if i + 1 < len(lines) else default
        if line.startswith(label + " "):
            return line[len(label) + 1 :].strip()
    return default


def parse_number(value, default=0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def parse_task_lines(lines):
    rows = []
    for idx, task in enumerate(TASKS):
        start = next((i for i, line in enumerate(lines) if line == task), None)
        inline = None
        if start is None:
            for i, line in enumerate(lines):
                if line.startswith(task + " "):
                    start = i
                    inline = line[len(task) + 1 :].strip()
                    break
        if start is None:
            rows.append({"task": task, "result": "", "errors": None, "observation": ""})
            continue

        if inline:
            match = re.match(r"^(Pass|Fail|Assist)\s+(\d+)\s+(.*)$", inline)
            if match:
                result, errors, obs = match.groups()
                rows.append({"task": task, "result": result, "errors": int(errors), "observation": obs})
                continue

        result = lines[start + 1] if start + 1 < len(lines) else ""
        errors = lines[start + 2] if start + 2 < len(lines) else ""
        obs = lines[start + 3] if start + 3 < len(lines) else ""
        rows.append(
            {
                "task": task,
                "result": result if result in {"Pass", "Fail", "Assist"} else "",
                "errors": int(errors) if errors.isdigit() else None,
                "observation": obs if result in {"Pass", "Fail", "Assist"} else "",
            }
        )
    return rows


def parse_sus(lines):
    answers = {}
    for question in SUS_QUESTIONS:
        answer = ""
        for i, line in enumerate(lines):
            if line == question and i + 1 < len(lines):
                answer = lines[i + 1]
                break
            if line.startswith(question + " "):
                answer = line[len(question) + 1 :].strip()
                break
        answers[question] = int(answer) if answer.isdigit() else None
    return answers


def parse_qual(lines):
    joined = "\n".join(lines)
    responses = {}
    for idx, question in enumerate(QUAL_QUESTIONS):
        next_questions = QUAL_QUESTIONS[idx + 1 :]
        pattern = re.escape(question) + r"\n(.*?)(?=\n(?:" + "|".join(map(re.escape, next_questions)) + r")\n|$)"
        match = re.search(pattern, joined, flags=re.S)
        responses[question] = " ".join(match.group(1).split()) if match else ""
    return responses


def main():
    reader = PdfReader(str(PDF_PATH))
    pages = [{"page": i + 1, "text": page.extract_text() or ""} for i, page in enumerate(reader.pages)]
    full_text = "\n".join(page["text"] for page in pages)
    chunks = re.split(r"(?=Participant\s+\d+\b)", full_text)
    participants = []

    for chunk in chunks:
        match = re.search(r"Participant\s+(\d+)", chunk)
        if not match:
            continue
        pid = int(match.group(1))
        lines = normalize_lines(chunk)
        details = {
            "participant": pid,
            "platform": after_label(lines, "Platform Name", "MySchool"),
            "version": after_label(lines, "Version Tested", ""),
            "device": after_label(lines, "Device Used", ""),
            "gender": after_label(lines, "Gender", ""),
            "duration": after_label(lines, "Session Duration", ""),
            "sus_score": parse_number(after_label(lines, "Individual SUS Score", "0"), 0),
        }
        participants.append(
            {
                **details,
                "tasks": parse_task_lines(lines),
                "sus": parse_sus(lines),
                "qualitative": parse_qual(lines),
            }
        )

    result = {
        "source_file": str(PDF_PATH),
        "page_count": len(pages),
        "participant_count": len(participants),
        "participants": participants,
    }
    OUT_PATH.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps({"participants": len(participants), "pages": len(pages), "out": str(OUT_PATH)}, indent=2))


if __name__ == "__main__":
    main()
