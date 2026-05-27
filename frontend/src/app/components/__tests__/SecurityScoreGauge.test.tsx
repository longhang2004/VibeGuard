import React from 'react';
import { render, screen } from '@testing-library/react';
import SecurityScoreGauge from '../SecurityScoreGauge';

describe('SecurityScoreGauge Component', () => {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  it('renders the score gauge and display texts correctly', () => {
    render(<SecurityScoreGauge score={85} />);

    // Check if the title is displayed
    expect(screen.getByText('Scan Safety Score')).toBeInTheDocument();
    
    // Check if the score value text is rendered
    const scoreVal = screen.getByTestId('gauge-score-value');
    expect(scoreVal).toHaveTextContent('85');

    // Check explanation text
    expect(screen.getByText(/Code scored/)).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });

  it('applies emerald (green) color class for high scores >= 80', () => {
    render(<SecurityScoreGauge score={80} />);
    const circle = screen.getByTestId('gauge-progress-circle');
    expect(circle).toHaveClass('stroke-emerald-500');
  });

  it('applies yellow color class for medium scores between 50 and 79', () => {
    render(<SecurityScoreGauge score={75} />);
    const circle = screen.getByTestId('gauge-progress-circle');
    expect(circle).toHaveClass('stroke-yellow-500');
  });

  it('applies red color class for low scores below 50', () => {
    render(<SecurityScoreGauge score={49} />);
    const circle = screen.getByTestId('gauge-progress-circle');
    expect(circle).toHaveClass('stroke-red-500');
  });

  it('clamps scores below 0 to 0', () => {
    render(<SecurityScoreGauge score={-20} />);
    
    const scoreVal = screen.getByTestId('gauge-score-value');
    expect(scoreVal).toHaveTextContent('0');

    const circle = screen.getByTestId('gauge-progress-circle');
    // For score 0, the dash offset should equal the full circumference
    const offset = parseFloat(circle.getAttribute('stroke-dashoffset') || '0');
    expect(offset).toBeCloseTo(circumference, 2);
    expect(circle).toHaveClass('stroke-red-500');
  });

  it('clamps scores above 100 to 100', () => {
    render(<SecurityScoreGauge score={150} />);
    
    const scoreVal = screen.getByTestId('gauge-score-value');
    expect(scoreVal).toHaveTextContent('100');

    const circle = screen.getByTestId('gauge-progress-circle');
    // For score 100, the dash offset should be 0
    const offset = parseFloat(circle.getAttribute('stroke-dashoffset') || '-1');
    expect(offset).toBeCloseTo(0, 2);
    expect(circle).toHaveClass('stroke-emerald-500');
  });
});
