import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
import { Boxes } from 'lucide-react';

describe('SmartStock UI Components & Interactions', () => {
  it('renders all status and role badges correctly', () => {
    const { rerender } = render(<Badge variant="IN_STOCK" label="Healthy Stock" />);
    expect(screen.getByText('Healthy Stock')).toBeInTheDocument();

    rerender(<Badge variant="LOW_STOCK" label="Reorder Alert" />);
    expect(screen.getByText('Reorder Alert')).toBeInTheDocument();

    rerender(<Badge variant="OUT_OF_STOCK" label="Zero Stock" />);
    expect(screen.getByText('Zero Stock')).toBeInTheDocument();

    rerender(<Badge variant="ADMIN" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();

    rerender(<Badge variant="EMPLOYEE" />);
    expect(screen.getByText('Staff')).toBeInTheDocument();

    rerender(<Badge variant="IN" />);
    expect(screen.getByText('+ IN')).toBeInTheDocument();

    rerender(<Badge variant="OUT" />);
    expect(screen.getByText('- OUT')).toBeInTheDocument();
  });

  it('renders StatCard with title, value, subtitle and trend badge', () => {
    render(
      <StatCard
        title="Inventory Valuation"
        value="$54,200.00"
        subtitle="At Standard Cost Basis"
        icon={Boxes}
        trend="+8.5%"
        trendColor="green"
      />
    );
    expect(screen.getByText('Inventory Valuation')).toBeInTheDocument();
    expect(screen.getByText('$54,200.00')).toBeInTheDocument();
    expect(screen.getByText('At Standard Cost Basis')).toBeInTheDocument();
    expect(screen.getByText('+8.5%')).toBeInTheDocument();
  });

  it('renders Modal when isOpen is true and triggers onClose when close button clicked', () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={true} onClose={handleClose} title="Replenish SKU" subtitle="Warehouse Intake">
        <div>Modal Body Content</div>
      </Modal>
    );

    expect(screen.getByText('Replenish SKU')).toBeInTheDocument();
    expect(screen.getByText('Warehouse Intake')).toBeInTheDocument();
    expect(screen.getByText('Modal Body Content')).toBeInTheDocument();

    // Click close button
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // When isOpen is false, nothing is rendered
    rerender(
      <Modal isOpen={false} onClose={handleClose} title="Replenish SKU">
        <div>Modal Body Content</div>
      </Modal>
    );
    expect(screen.queryByText('Replenish SKU')).not.toBeInTheDocument();
  });
});
