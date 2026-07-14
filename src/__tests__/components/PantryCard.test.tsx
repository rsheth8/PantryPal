import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import PantryCard from '../../components/PantryCard';
import { ThemeProvider } from '../../theme/ThemeContext';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe('PantryCard', () => {
  it('renders children', () => {
    const { getByText } = renderWithTheme(
      <PantryCard>
        <Text>Card content</Text>
      </PantryCard>
    );
    expect(getByText('Card content')).toBeTruthy();
  });

  it('renders each variant without crashing', () => {
    (['default', 'fresh', 'warm', 'elevated', 'outlined'] as const).forEach(
      variant => {
        const { getByText } = renderWithTheme(
          <PantryCard variant={variant}>
            <Text>{variant}</Text>
          </PantryCard>
        );
        expect(getByText(variant)).toBeTruthy();
      }
    );
  });
});
