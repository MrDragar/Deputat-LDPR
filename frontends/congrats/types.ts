export interface RadioOption {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface Person {
  lastName: string;
  firstName: string;
  middleName: string;
}

// To simplify state management, recipient has all possible fields.
// The UI will control which ones are shown.
interface Recipient extends Person {
  companyName: string;
}

export interface FormData {
  recipient: Recipient;
  entityType: 'individual' | 'legal_entity';
  gender: string;
  date: string;
}

export interface SenderPreset {
  lastName: string;
  firstName: string;
  middleName: string;
  signature: string; // data URL of an SVG
}
