export type AppTab = 'home' | 'projects' | 'files' | 'compliance' | 'reports' | 'memory' | 'team' | 'profile' | 'archives' | 'guide' | 'reasoning'|'ghostfix'| 'workshop'| "compliance-center" | "materials-sandbox";

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ori';
  text: string;
  time: string;
  isStreaming?: boolean;
  tableData?: {
    location?: string;
    shearDemand?: string;
    shearCapacity?: string;
    clauseViolated?: string;
    reason?: string;
    suggestedFix?: string;
  };
  sources?: string[];
}

export interface ActiveProject {
  id: string;
  name: string;
  sector: string;
  discipline: string;
  status: 'Modeling' | 'Review' | 'Compliance Check' | 'Approved';
  progress: number;
  deadline: string;
  dataSize: string;
  engineersCount: number;
  image: string;
}

export interface ProjectDoc {
  id: string;
  filename: string;
  type: 'Model' | 'Drawing' | 'Spec' | 'Calc Sheet';
  size: string;
  status: string;
  statusColor: 'green' | 'blue' | 'yellow' | 'red';
  lastEdited: string;
}

export interface ViolationEntry {
  id: string;
  clause: string;
  ref: string;
  project: string;
  severity: 'CRITICAL' | 'WARNING';
  description: string;
  reportedDate: string;
  assignedTo: string;
}

export interface ContextLogEntry {
  id: string;
  type: 'DECISION' | 'INCONSISTENCY' | 'AUTO-UPDATE';
  ref: string;
  title: string;
  time: string;
  explanation: string;
  approvedBy?: string;
  status?: string;
  avatarUrl?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  avatarInitials: string;
  email: string;
  activeProjects: number;
  assignedViolations: number;
}
