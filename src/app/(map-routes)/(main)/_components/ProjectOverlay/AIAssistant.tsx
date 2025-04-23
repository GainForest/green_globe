import React from "react";

const AIAssistant = () => {
  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="w-full h-20"></div>

      <iframe
        title={"Polly chatbot"}
        className="flex-1 rounded-lg overflow-hidden min-h-[540px]"
        src="https://polly.gainforest.earth/"
        style={{
          zoom: 0.8,
        }}
      />
    </div>
  );
};

export default AIAssistant;
