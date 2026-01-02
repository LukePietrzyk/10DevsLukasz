import React from "react";
import SourceForm from "./SourceForm";
import ProposalsPanel from "./ProposalsPanel";

const GenerateLayout: React.FC = () => {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header section */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Generowanie fiszek</h1>
        <p className="text-muted-foreground text-sm">
          Wklej materiał źródłowy, a AI wygeneruje propozycje fiszek do nauki
        </p>
      </div>

      {/* Main content - two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Source Form (1/3 width on md+) */}
        <div className="md:col-span-1">
          <SourceForm />
        </div>

        {/* Right column - Proposals Panel (2/3 width on md+) */}
        <div className="md:col-span-2">
          <ProposalsPanel />
        </div>
      </div>
    </div>
  );
};

export default GenerateLayout;
