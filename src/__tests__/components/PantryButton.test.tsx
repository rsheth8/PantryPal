import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PantryButton from '../../components/PantryButton';

describe('PantryButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with title', () => {
    const { getByText } = render(
      <PantryButton title='Test Button' onPress={mockOnPress} />
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <PantryButton title='Test Button' onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders with different variants', () => {
    const { getByText, rerender } = render(
      <PantryButton title='Primary' onPress={mockOnPress} variant='primary' />
    );

    expect(getByText('Primary')).toBeTruthy();

    rerender(
      <PantryButton
        title='Secondary'
        onPress={mockOnPress}
        variant='secondary'
      />
    );

    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders with subtitle when provided', () => {
    const { getByText } = render(
      <PantryButton
        title='Main Title'
        subtitle='Subtitle text'
        onPress={mockOnPress}
      />
    );

    expect(getByText('Main Title')).toBeTruthy();
    expect(getByText('Subtitle text')).toBeTruthy();
  });

  it('renders with icon when provided', () => {
    const { getByText } = render(
      <PantryButton title='Icon Button' icon='🍎' onPress={mockOnPress} />
    );

    expect(getByText('Icon Button')).toBeTruthy();
    expect(getByText('🍎')).toBeTruthy();
  });

  it('applies disabled state correctly', () => {
    const { getByText } = render(
      <PantryButton title='Disabled Button' onPress={mockOnPress} disabled />
    );

    const button = getByText('Disabled Button');
    fireEvent.press(button);

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders with different sizes', () => {
    const { getByText, rerender } = render(
      <PantryButton title='Small' onPress={mockOnPress} size='sm' />
    );

    expect(getByText('Small')).toBeTruthy();

    rerender(<PantryButton title='Large' onPress={mockOnPress} size='lg' />);

    expect(getByText('Large')).toBeTruthy();
  });
});
