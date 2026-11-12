import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { Surface } from '@project/ui';

import { server } from '../test/server';
import Page from './page';

describe('workspace foundation', () => {
  it('renders the route with an honest setup state and no inactive controls', () => {
    render(<Page />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'LedgerSentinel', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Workspace in preparation')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the shared surface with accessible naming and forwarded HTML attributes', () => {
    render(<Surface aria-label="Review summary" className="summary">No records yet</Surface>);
    const region = screen.getByRole('region', { name: 'Review summary' });
    expect(region).toHaveTextContent('No records yet');
    expect(region).toHaveClass('ui-surface', 'summary');
  });

  it('intercepts a real request through the MSW harness', async () => {
    server.use(http.get('http://localhost/harness', () => HttpResponse.json({ ready: true })));
    const response = await fetch('http://localhost/harness');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ready: true });
  });
});
