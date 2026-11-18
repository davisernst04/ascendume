// Questions the user answers so the AI can write from facts they supplied.

const RULES: { match: RegExp; question: string }[] = [
  { match: /\b(tutor|taught|teach|mentor|coach|train)/i, question: "Roughly how many students or people did you work with, and how often?" },
  { match: /\b(led|lead|manag|supervis|organiz|coordinat|direct|chair)/i, question: "Roughly how many people did you lead or work with, and what did the group get done?" },
  { match: /\b(optimi|improv|reduc|cut|speed|faster|automat|streamlin|increas|decreas|lower)/i, question: "By roughly how much did it change: %, time saved, cost, or errors?" },
  { match: /\b(raise|fundrais|sold|sales|revenue|grant|budget)/i, question: "Roughly how much money or how many sales were involved?" },
  { match: /\b(research|analy|study|experiment|survey|test)/i, question: "Roughly how much data, how many samples or participants, or what result did you get?" },
  { match: /\b(event|workshop|hackathon|outreach|recruit|volunteer)/i, question: "Roughly how many people attended, joined, or were helped?" },
  { match: /\b(built|build|develop|creat|design|launch|ship|implement|wrote|code|program|app|website|tool|bot)/i, question: "Roughly how many people used it, or how much time or work did it save?" },
];

const FALLBACK = "Is there a number that shows the size of this: users, people, hours saved, % improvement, or how often?";

/** A question aimed at the number this bullet is most likely missing. */
export function questionFor(bullet: string): string {
  return RULES.find((r) => r.match.test(bullet))?.question ?? FALLBACK;
}

/** The guided interview, asked per job or project. Only `did` is required. */
export const INTERVIEW_QUESTIONS = [
  { id: "role", label: "What was your role?", placeholder: "e.g. Software intern, team lead for a class project, club treasurer", required: false },
  { id: "did", label: "What did you build or do?", placeholder: "Plain words are fine: tools, what you made, who it was for", required: true },
  { id: "result", label: "What changed because of it, and roughly how much?", placeholder: "e.g. about 200 students used it; cut grading time from 2 hours to 30 minutes. Leave blank if you're not sure.", required: false },
  { id: "tools", label: "Tools, skills or methods you used (optional)", placeholder: "e.g. Python, SolidWorks, PCR, Excel", required: false },
] as const;

export type InterviewAnswers = Record<(typeof INTERVIEW_QUESTIONS)[number]["id"], string>;
