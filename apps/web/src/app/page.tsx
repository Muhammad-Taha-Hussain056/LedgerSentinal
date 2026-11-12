import { Surface } from '@project/ui';

import { foundationMessages as messages } from '../lib/messages';

export default function Page() {
  return (
    <main className="foundation">
      <p className="environment">{messages.environment}</p>
      <header className="identity">
        <h1>{messages.title}</h1>
        <p className="purpose">{messages.purpose}</p>
      </header>
      <Surface aria-labelledby="foundation-status">
        <h2 id="foundation-status">{messages.status}</h2>
        <p>{messages.detail}</p>
      </Surface>
    </main>
  );
}
