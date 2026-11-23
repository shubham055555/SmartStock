import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { Boxes } from 'lucide-react';

describe('SmartStock UI Components', () => {
  it('renders IN_STOCK badge correctly', () => {
    render(<Badge variant="IN_STOCK" label="In Stock" />);
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('renders LOW_STOCK badge correctly', () => {
    render(<Badge variant="LOW_STOCK" label="Low Stock" />);
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('renders OUT_OF_STOCK badge correctly', () => {
    render(<Badge variant="OUT_OF_STOCK" label="Out of Stock" />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('renders StatCard with title, value and trend', () => {
    render(
      <StatCard
        title="Total Products"
        value={150}
        subtitle="Active Inventory SKUs"
        icon={Boxes}
        trend="+12%"
        trendColor="green"
      />
    );
    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Active Inventory SKUs')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });
});
