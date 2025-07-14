
import React from "react";
import { QuestionContentProps } from "./types";
import { ShortText } from "./content/short-text";
import { Paragraph } from "./content/paragraph";
import { MultipleChoice } from "./content/multiple-choice";
import { Checkbox } from "./content/checkbox";
import { Dropdown } from "./content/dropdown";
import { Calculation } from "./content/calculation";
import { Vitals } from "./content/vitals";
import { DiagnosisComponent } from "./content/diagnosis";
import { Clinical } from "./content/clinical";
import { Multifield } from "./content/multifield";
import { Signature } from "./content/signature";
import { FileUpload } from "./content/file-upload";
import { MedicationContent } from "./content/medication";

export const QuestionContent: React.FC<QuestionContentProps> = ({ 
  question, 
  onUpdate, 
  readOnly 
}) => {
  switch (question.type) {
    case "short":
      return <ShortText question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "paragraph":
      return <Paragraph question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "multiple":
      return <MultipleChoice question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "checkbox":
      return <Checkbox question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "dropdown":
      return <Dropdown question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "calculation":
      return <Calculation question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "vitals":
      return <Vitals question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "diagnosis":
      return <DiagnosisComponent question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "clinical":
      return <Clinical question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "multifield":
      return <Multifield question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "signature":
      return <Signature question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "file":
      return <FileUpload question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    case "medication":
      return <MedicationContent question={question} onUpdate={onUpdate} readOnly={readOnly} />;
    default:
      return <div>Tipo de pregunta no soportado: {question.type}</div>;
  }
};
