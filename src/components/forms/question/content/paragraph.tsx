
import React from "react";
import { ContentComponentProps } from "../types";

export const Paragraph: React.FC<ContentComponentProps> = ({ question, readOnly }) => {
  return (
    <div>
      {readOnly ? (
        <textarea placeholder="Respuesta larga" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" rows={3} />
      ) : null}
    </div>
  );
};
