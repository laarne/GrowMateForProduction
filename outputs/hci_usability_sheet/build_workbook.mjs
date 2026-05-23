import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = __dirname;
const data = JSON.parse(await fs.readFile(path.join(__dirname, "hci_usability_data.json"), "utf8"));
const workbook = Workbook.create();

const colors = {
  ink: "#111827",
  slate: "#334155",
  header: "#164E63",
  teal: "#0F766E",
  blue: "#2563EB",
  amber: "#D97706",
  red: "#DC2626",
  green: "#16A34A",
  softBlue: "#DBEAFE",
  softTeal: "#CCFBF1",
  softAmber: "#FEF3C7",
  softRed: "#FEE2E2",
  line: "#CBD5E1",
  fill: "#F8FAFC",
};

function styleTitle(sheet, range, title, subtitle = "") {
  sheet.showGridLines = false;
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[title]];
  r.format = {
    fill: colors.header,
    font: { bold: true, color: "#FFFFFF", size: 18 },
    verticalAlignment: "center",
  };
  r.format.rowHeightPx = 42;
  if (subtitle) {
    const sub = sheet.getRange("A2:H2");
    sub.merge();
    sub.values = [[subtitle]];
    sub.format = { fill: "#E0F2FE", font: { color: colors.slate, italic: true }, wrapText: true };
    sub.format.rowHeightPx = 34;
  }
}

function styleHeader(range) {
  range.format = {
    fill: colors.teal,
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
  };
}

function setWidths(sheet, widths) {
  widths.forEach((w, idx) => {
    sheet.getCell(0, idx).format.columnWidthPx = w;
  });
}

function addTable(sheet, range, name) {
  const table = sheet.tables.add(range, true, name);
  table.style = "TableStyleMedium2";
  table.showFilterButton = true;
  return table;
}

function countKeywords(texts, label, keywords) {
  const re = new RegExp(keywords.join("|"), "i");
  return texts.filter((text) => re.test(text || "")).length;
}

const participants = data.participants;
const taskRows = participants.flatMap((p) =>
  p.tasks.map((t) => [
    p.participant,
    p.device,
    p.gender,
    p.sus_score,
    t.task,
    t.result,
    t.errors ?? "",
    t.observation,
  ]),
);

const participantRows = participants.map((p) => [
  p.participant,
  p.platform || "MySchool",
  p.version || "Original",
  p.device,
  p.gender,
  p.duration,
  p.sus_score,
  p.tasks.filter((t) => t.result === "Pass").length,
  p.tasks.filter((t) => t.result === "Assist").length,
  p.tasks.filter((t) => t.result === "Fail").length,
  p.tasks.reduce((sum, t) => sum + (t.errors || 0), 0),
]);

const susRows = participants.map((p) => [
  p.participant,
  ...Object.values(p.sus),
  p.sus_score,
]);

const qualitativeRows = participants.map((p) => [
  p.participant,
  p.qualitative["Most liked feature"],
  p.qualitative["Suggested improvements"],
  p.qualitative["Unnecessary feature"],
  p.qualitative["Most frustrating part"],
  p.qualitative["Design change suggestion"],
  p.qualitative["Text readability"],
  p.qualitative["Overall remarks"],
]);

const allObservationText = [
  ...taskRows.map((row) => row[7]),
  ...qualitativeRows.flatMap((row) => row.slice(1)),
];

const themeRows = [
  ["Mobile readability / small text", countKeywords(allObservationText, "text", ["small text", "too small", "larger fonts", "readability"])],
  ["Navigation confusion", countKeywords(allObservationText, "nav", ["navigation", "tabs", "confusing", "trial and error"])],
  ["Accidental logout", countKeywords(allObservationText, "logout", ["logout"])],
  ["Mobile responsiveness", countKeywords(allObservationText, "mobile", ["mobile", "responsiveness", "devices"])],
  ["Straightforward login", countKeywords(allObservationText, "login", ["login process was straightforward", "straightforward"])],
];

const summary = workbook.worksheets.add("Summary");
styleTitle(
  summary,
  "A1:J1",
  "MySchool HCI Usability Analysis",
  `Source: HCI_Usability_OURSCHOOL-1-1.pdf | ${data.participant_count} participants | ${data.page_count} PDF pages`,
);
setWidths(summary, [200, 115, 55, 230, 110, 110, 110, 120, 115, 80]);

summary.getRange("A4:B8").values = [
  ["Metric", "Value"],
  ["Participants", ""],
  ["Average SUS", ""],
  ["Overall pass rate", ""],
  ["Average task errors", ""],
];
styleHeader(summary.getRange("A4:B4"));
summary.getRange("B5:B8").formulas = [
  ["=COUNTA(Participants!A3:A32)"],
  ["=AVERAGE(Participants!G3:G32)"],
  ["=COUNTIF('Task Log'!F3:F302,\"Pass\")/COUNTA('Task Log'!F3:F302)"],
  ["=AVERAGE('Task Log'!G3:G302)"],
];
summary.getRange("B6").format.numberFormat = "0.0";
summary.getRange("B7").format.numberFormat = "0.0%";
summary.getRange("B8").format.numberFormat = "0.00";
summary.getRange("A4:B8").format.borders = { all: { style: "Continuous", color: colors.line } };

summary.getRange("D4:I4").values = [["Task", "Pass", "Assist", "Fail", "Pass Rate", "Avg Errors"]];
styleHeader(summary.getRange("D4:I4"));
const taskNames = participants[0].tasks.map((t) => t.task);
summary.getRange(`D5:D${4 + taskNames.length}`).values = taskNames.map((task) => [task]);
summary.getRange("E5:I5").formulas = [[
  '=COUNTIFS(\'Task Log\'!$E$3:$E$302,$D5,\'Task Log\'!$F$3:$F$302,"Pass")',
  '=COUNTIFS(\'Task Log\'!$E$3:$E$302,$D5,\'Task Log\'!$F$3:$F$302,"Assist")',
  '=COUNTIFS(\'Task Log\'!$E$3:$E$302,$D5,\'Task Log\'!$F$3:$F$302,"Fail")',
  '=IFERROR(E5/SUM(E5:G5),0)',
  '=AVERAGEIF(\'Task Log\'!$E$3:$E$302,$D5,\'Task Log\'!$G$3:$G$302)',
]];
summary.getRange(`E5:I${4 + taskNames.length}`).fillDown();
summary.getRange(`H5:H${4 + taskNames.length}`).format.numberFormat = "0.0%";
summary.getRange(`I5:I${4 + taskNames.length}`).format.numberFormat = "0.00";
summary.getRange(`D4:I${4 + taskNames.length}`).format.borders = { all: { style: "Continuous", color: colors.line } };
addTable(summary, `D4:I${4 + taskNames.length}`, "TaskSummaryTable");

summary.getRange("A11:B16").values = [["Theme", "Mentions"], ...themeRows];
styleHeader(summary.getRange("A11:B11"));
summary.getRange("A11:B16").format.borders = { all: { style: "Continuous", color: colors.line } };
addTable(summary, "A11:B16", "ThemeSummaryTable");

const chart = summary.charts.add("bar", summary.getRange(`D4:G${4 + taskNames.length}`));
chart.title = "Task Outcomes by Task";
chart.hasLegend = true;
chart.xAxis = { axisType: "textAxis" };
chart.setPosition("K4", "R20");

const themeChart = summary.charts.add("bar", summary.getRange("A11:B16"));
themeChart.title = "Most Frequent Usability Themes";
themeChart.hasLegend = false;
themeChart.setPosition("K22", "R36");

summary.freezePanes.freezeRows(4);

const participantSheet = workbook.worksheets.add("Participants");
styleTitle(participantSheet, "A1:K1", "Participant Session Details");
setWidths(participantSheet, [90, 110, 110, 110, 90, 110, 95, 95, 95, 95, 110]);
participantSheet.getRange("A2:K2").values = [[
  "Participant",
  "Platform",
  "Version",
  "Device",
  "Gender",
  "Duration",
  "SUS Score",
  "Pass Tasks",
  "Assist Tasks",
  "Fail Tasks",
  "Total Errors",
]];
participantSheet.getRange(`A3:K${2 + participantRows.length}`).values = participantRows;
styleHeader(participantSheet.getRange("A2:K2"));
participantSheet.getRange(`G3:G${2 + participantRows.length}`).format.numberFormat = "0.0";
addTable(participantSheet, `A2:K${2 + participantRows.length}`, "ParticipantsTable");
participantSheet.freezePanes.freezeRows(2);

const taskSheet = workbook.worksheets.add("Task Log");
styleTitle(taskSheet, "A1:H1", "Task Performance Log");
setWidths(taskSheet, [90, 110, 90, 95, 190, 90, 85, 330]);
taskSheet.getRange("A2:H2").values = [["Participant", "Device", "Gender", "SUS Score", "Task", "Result", "# Errors", "Observation"]];
taskSheet.getRange(`A3:H${2 + taskRows.length}`).values = taskRows;
styleHeader(taskSheet.getRange("A2:H2"));
taskSheet.getRange(`H3:H${2 + taskRows.length}`).format.wrapText = true;
addTable(taskSheet, `A2:H${2 + taskRows.length}`, "TaskLogTable");
taskSheet.freezePanes.freezeRows(2);

const susSheet = workbook.worksheets.add("SUS Responses");
styleTitle(susSheet, "A1:L1", "System Usability Scale Responses");
setWidths(susSheet, [90, 120, 145, 110, 135, 125, 145, 110, 130, 145, 150, 95]);
susSheet.getRange("A2:L2").values = [[
  "Participant",
  "Use frequently",
  "System complex",
  "Easy to use",
  "Need support",
  "Integrated",
  "Inconsistent",
  "Learn quickly",
  "Cumbersome",
  "Confident",
  "Need to learn",
  "SUS Score",
]];
susSheet.getRange(`A3:L${2 + susRows.length}`).values = susRows;
styleHeader(susSheet.getRange("A2:L2"));
susSheet.getRange(`B3:K${2 + susRows.length}`).format.numberFormat = "0";
susSheet.getRange(`L3:L${2 + susRows.length}`).format.numberFormat = "0.0";
addTable(susSheet, `A2:L${2 + susRows.length}`, "SUSResponsesTable");
susSheet.freezePanes.freezeRows(2);

const qualSheet = workbook.worksheets.add("Qualitative Insights");
styleTitle(qualSheet, "A1:H1", "Qualitative Insights");
setWidths(qualSheet, [90, 230, 250, 230, 240, 250, 230, 230]);
qualSheet.getRange("A2:H2").values = [[
  "Participant",
  "Most liked feature",
  "Suggested improvements",
  "Unnecessary feature",
  "Most frustrating part",
  "Design change suggestion",
  "Text readability",
  "Overall remarks",
]];
qualSheet.getRange(`A3:H${2 + qualitativeRows.length}`).values = qualitativeRows;
styleHeader(qualSheet.getRange("A2:H2"));
qualSheet.getRange(`B3:H${2 + qualitativeRows.length}`).format.wrapText = true;
addTable(qualSheet, `A2:H${2 + qualitativeRows.length}`, "QualitativeInsightsTable");
qualSheet.freezePanes.freezeRows(2);

const sourceSheet = workbook.worksheets.add("Source Notes");
styleTitle(sourceSheet, "A1:D1", "Source Notes and Workbook Guide");
setWidths(sourceSheet, [180, 420, 160, 160]);
sourceSheet.getRange("A3:B10").values = [
  ["Source PDF", data.source_file],
  ["PDF pages extracted", data.page_count],
  ["Participant records parsed", data.participant_count],
  ["Workbook purpose", "Structured usability-test analysis for MySchool, including task outcomes, SUS responses, participant details, and qualitative themes."],
  ["How to use", "Filter task logs by result, participant, or device; review Summary for aggregate metrics; use qualitative tabs for design recommendations."],
  ["Formula-backed areas", "Summary metrics and task-summary table use formulas tied to the participant and task-log tabs."],
  ["Created", new Date().toISOString().slice(0, 10)],
  ["Notes", "Some values are extracted from PDF text; review against source PDF if using for formal submission."],
];
sourceSheet.getRange("A3:A10").format = { fill: colors.softTeal, font: { bold: true, color: colors.ink } };
sourceSheet.getRange("B3:B10").format = { wrapText: true };

const summaryInspect = await workbook.inspect({
  kind: "table",
  range: "Summary!A4:I16",
  include: "values,formulas",
  tableMaxRows: 16,
  tableMaxCols: 9,
});
console.log(summaryInspect.ndjson);

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errorScan.ndjson);

for (const sheetName of ["Summary", "Participants", "Task Log", "SUS Responses", "Qualitative Insights", "Source Notes"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, `${sheetName.replaceAll(" ", "_").toLowerCase()}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
const outPath = path.join(outputDir, "MySchool_HCI_Usability_Analysis.xlsx");
await xlsx.save(outPath);
console.log(JSON.stringify({ outPath }, null, 2));
