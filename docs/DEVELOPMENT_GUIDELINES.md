# 🛠️ Development Guidelines for PantryPal

## 📋 Table of Contents
1. [Code Style & Standards](#code-style--standards)
2. [Architecture Patterns](#architecture-patterns)
3. [Testing Guidelines](#testing-guidelines)
4. [Performance Guidelines](#performance-guidelines)
5. [Security Guidelines](#security-guidelines)
6. [Accessibility Guidelines](#accessibility-guidelines)
7. [Git Workflow](#git-workflow)
8. [Documentation Standards](#documentation-standards)

## 🎨 Code Style & Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use meaningful type names
- Avoid `any` type - use `unknown` or proper typing
- Use union types for better type safety

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'member' | 'guest';

// ❌ Bad
const user: any = { id: 1, name: 'John' };
```

### React Native Guidelines
- Use functional components with hooks
- Prefer `useCallback` and `useMemo` for performance
- Use proper prop types and interfaces
- Follow React Native best practices

```typescript
// ✅ Good
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary' }) => {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};
```

### Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names

```typescript
// ✅ Good
// components/PantryCard.tsx
// utils/formatCurrency.ts
// types/User.ts

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
}

const MAX_RETRY_ATTEMPTS = 3;
const formatCurrency = (amount: number): string => { /* ... */ };
```

## 🏗️ Architecture Patterns

### Component Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Basic UI components
│   ├── forms/          # Form-related components
│   └── layout/         # Layout components
├── features/           # Feature-specific code
│   ├── auth/          # Authentication feature
│   │   ├── components/ # Feature-specific components
│   │   ├── hooks/     # Feature-specific hooks
│   │   ├── services/  # Feature-specific services
│   │   └── types/     # Feature-specific types
│   └── pantry/        # Pantry feature
├── services/          # Business logic and API calls
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── types/             # Global type definitions
```

### State Management
- Use Zustand for global state
- Use React state for component-specific state
- Use React Query for server state (future)
- Keep state as close to where it's used as possible

### Service Layer
- Separate business logic from UI components
- Use dependency injection for services
- Implement proper error handling
- Use TypeScript for service interfaces

```typescript
// ✅ Good Service Pattern
interface PantryService {
  getItems(): Promise<PantryItem[]>;
  addItem(item: Omit<PantryItem, 'id'>): Promise<PantryItem>;
  updateItem(id: string, updates: Partial<PantryItem>): Promise<PantryItem>;
  deleteItem(id: string): Promise<void>;
}

class PantryServiceImpl implements PantryService {
  async getItems(): Promise<PantryItem[]> {
    try {
      const response = await supabase.from('pantry_items').select('*');
      return response.data || [];
    } catch (error) {
      throw new Error('Failed to fetch pantry items');
    }
  }
}
```

## 🧪 Testing Guidelines

### Test Structure
```
src/
├── __tests__/         # Test files
│   ├── components/    # Component tests
│   ├── services/     # Service tests
│   ├── hooks/        # Hook tests
│   └── utils/        # Utility tests
```

### Testing Principles
- Write tests for all business logic
- Test user interactions, not implementation details
- Use meaningful test descriptions
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
// ✅ Good Test
describe('PantryCard', () => {
  it('should display item name and quantity', () => {
    // Arrange
    const item = { id: '1', name: 'Apple', quantity: 5 };
    
    // Act
    render(<PantryCard item={item} />);
    
    // Assert
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
```

### Test Coverage Goals
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Main user journeys

## ⚡ Performance Guidelines

### React Native Performance
- Use `React.memo` for expensive components
- Implement proper list virtualization
- Optimize images and assets
- Use performance monitoring tools

### Bundle Size
- Monitor bundle size regularly
- Use tree shaking effectively
- Lazy load components when possible
- Remove unused dependencies

### Memory Management
- Clean up event listeners
- Dispose of subscriptions
- Use proper cleanup in useEffect
- Monitor memory usage

## 🔒 Security Guidelines

### Data Protection
- Never store sensitive data in AsyncStorage
- Use secure storage for sensitive information
- Validate all user inputs
- Implement proper authentication

### API Security
- Use HTTPS for all API calls
- Implement proper error handling
- Don't expose sensitive data in error messages
- Use environment variables for API keys

```typescript
// ✅ Good Security Practice
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
if (!API_KEY) {
  throw new Error('API key not configured');
}
```

## ♿ Accessibility Guidelines

### React Native Accessibility
- Use proper accessibility labels
- Implement screen reader support
- Ensure proper color contrast
- Support dynamic text sizes

```typescript
// ✅ Good Accessibility
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Add item to pantry"
  accessibilityHint="Double tap to add this item to your pantry"
  onPress={handleAddItem}
>
  <Text>Add Item</Text>
</TouchableOpacity>
```

### WCAG Compliance
- Follow WCAG 2.1 AA guidelines
- Test with screen readers
- Ensure keyboard navigation
- Provide alternative text for images

## 🔄 Git Workflow

### Branch Naming
- `feature/feature-name`: New features
- `bugfix/bug-description`: Bug fixes
- `hotfix/urgent-fix`: Critical fixes
- `refactor/component-name`: Code refactoring

### Commit Messages
Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tool changes

### Pull Request Process
1. Create feature branch from `develop`
2. Implement feature with tests
3. Create PR with detailed description
4. Address review feedback
5. Merge to `develop`
6. Deploy to staging

## 📚 Documentation Standards

### Code Documentation
- Document complex functions
- Use JSDoc for public APIs
- Keep comments up to date
- Document business logic

```typescript
/**
 * Calculates the total value of pantry items
 * @param items - Array of pantry items
 * @returns Total value in dollars
 */
const calculateTotalValue = (items: PantryItem[]): number => {
  return items.reduce((total, item) => total + (item.price || 0), 0);
};
```

### README Files
- Keep README files updated
- Include setup instructions
- Document API changes
- Provide usage examples

### Architecture Documentation
- Document system architecture
- Update design decisions
- Maintain API documentation
- Keep deployment guides current

## 🚀 Best Practices Summary

### Do's ✅
- Write clean, readable code
- Follow TypeScript best practices
- Write comprehensive tests
- Document your code
- Use proper error handling
- Follow security guidelines
- Optimize for performance
- Consider accessibility

### Don'ts ❌
- Don't commit broken code
- Don't ignore TypeScript errors
- Don't skip tests
- Don't use `any` type
- Don't hardcode sensitive data
- Don't ignore performance issues
- Don't forget accessibility
- Don't skip code reviews

## 📖 Resources

- [React Native Best Practices](https://reactnative.dev/docs/performance)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Git Conventional Commits](https://www.conventionalcommits.org/)
