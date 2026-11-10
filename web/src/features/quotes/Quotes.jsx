import { EmptyState, PageIntro } from '../../shared/components/Primitives.jsx';

// À venir : la préparation et le suivi des devis envoyés à celles et ceux qui louent un espace.
export default function Quotes() {
  return <>
    <PageIntro eyebrow="ESPACE ÉQUIPE · DEVIS" title="Devis" description="Cette section arrive bientôt." />
    <EmptyState title="Les devis arrivent bientôt" text="Ici, vous pourrez préparer et suivre les devis envoyés aux personnes qui louent un espace." />
  </>;
}
