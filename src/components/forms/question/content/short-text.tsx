
import React from "react";
import { ContentComponentProps } from "../types";

export const ShortText: React.FC<ContentComponentProps> = ({ question, readOnly }) => {
  return (
    <div>
      {readOnly ? (
        <input type="text" placeholder="Respuesta corta" disabled className="w-full border-b border-gray-300 py-1 px-0 bg-transparent" />
      ) : null}
    </div>
  );
};
