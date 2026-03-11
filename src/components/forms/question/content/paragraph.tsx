
import React from "react";
import { ContentComponentProps } from "../types";

export const Paragraph: React.FC<ContentComponentProps> = ({ question, readOnly }) => {
  return (
    <div>
      {readOnly ? (
        <textarea placeholder="Respuesta larga" disabled className="w-full border border-border rounded-md p-2 bg-transparent min-h-[120px] resize-y" rows={4} />
      ) : null}
    </div>
  );
};
