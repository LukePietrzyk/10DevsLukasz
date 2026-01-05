import React from "react";
import { useGenerateStore } from "@/lib/stores/generate.store";
import ProposalCard from "./ProposalCard";

interface ProposalListProps {
  onCardClick?: (index: number) => void;
}

const ProposalList: React.FC<ProposalListProps> = ({ onCardClick }) => {
  const { proposals, selectedIds } = useGenerateStore();

  if (proposals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Brak propozycji do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {proposals.map((proposal, index) => (
        <ProposalCard
          key={`proposal-${index}`}
          proposal={proposal}
          index={index}
          isSelected={selectedIds.has(index)}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
};

export default ProposalList;
