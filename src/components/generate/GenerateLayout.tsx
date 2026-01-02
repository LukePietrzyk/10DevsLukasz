import React from "react";
import SourceForm from "./SourceForm";
import ProposalsPanel from "./ProposalsPanel";

const GenerateLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Generowanie fiszek</h1>
          <p className="text-muted-foreground mt-2">
            Wklej materiał źródłowy, a AI wygeneruje propozycje fiszek do nauki
          </p>
        </div>
      </header>

      {/* Main content - two column layout */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {/* Left column - Source Form (1/3 width on md+) */}
          <div className="md:col-span-1">
            <SourceForm />
          </div>

          {/* Right column - Proposals Panel (2/3 width on md+) */}
          <div className="md:col-span-2">
            <ProposalsPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default GenerateLayout;
