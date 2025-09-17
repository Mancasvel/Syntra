import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HeroSection } from '../HeroSection';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('HeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders main heading and description', () => {
    render(<HeroSection />);
    
    expect(screen.getByText(/Transformamos eventos en/)).toBeInTheDocument();
    expect(screen.getByText(/experiencias/)).toBeInTheDocument();
    expect(screen.getByText(/Conecta asistentes con/)).toBeInTheDocument();
  });

  it('displays call-to-action buttons', () => {
    render(<HeroSection />);
    
    expect(screen.getByText('Crear mi evento')).toBeInTheDocument();
    expect(screen.getByText('Ver demo (2 min)')).toBeInTheDocument();
  });

  it('shows statistics section', () => {
    render(<HeroSection />);
    
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('Eventos exitosos')).toBeInTheDocument();
    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('Conexiones creadas')).toBeInTheDocument();
    expect(screen.getByText('25K+')).toBeInTheDocument();
    expect(screen.getByText('Dispositivos activos')).toBeInTheDocument();
  });

  it('opens video modal when demo button is clicked', async () => {
    render(<HeroSection />);
    
    const demoButton = screen.getByText('Ver demo (2 min)');
    fireEvent.click(demoButton);
    
    await waitFor(() => {
      expect(screen.getByText('Video demo aquí')).toBeInTheDocument();
    });
  });

  it('closes video modal when clicked outside', async () => {
    render(<HeroSection />);
    
    // Open modal
    const demoButton = screen.getByText('Ver demo (2 min)');
    fireEvent.click(demoButton);
    
    await waitFor(() => {
      expect(screen.getByText('Video demo aquí')).toBeInTheDocument();
    });
    
    // Click outside to close
    const modal = screen.getByText('Video demo aquí').closest('.fixed');
    if (modal) {
      fireEvent.click(modal);
    }
    
    await waitFor(() => {
      expect(screen.queryByText('Video demo aquí')).not.toBeInTheDocument();
    });
  });

  it('displays floating elements and decorative content', () => {
    render(<HeroSection />);
    
    // Check for badge
    expect(screen.getByText(/Revoluciona tus eventos con IA y NFC/)).toBeInTheDocument();
    
    // Check for scroll indicator (should be present in DOM)
    const scrollIndicator = document.querySelector('.animate-bounce');
    expect(scrollIndicator).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<HeroSection />);
    
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('displays dynamic word animation', () => {
    render(<HeroSection />);
    
    // The component should have dynamic words
    const dynamicWords = ['memorables', 'conectadas', 'inteligentes', 'únicas', 'innovadoras'];
    
    // At least one of these words should be present initially
    const hasAnyDynamicWord = dynamicWords.some(word => 
      screen.queryByText(word) !== null
    );
    expect(hasAnyDynamicWord).toBe(true);
  });

  it('renders with proper CSS classes for styling', () => {
    const { container } = render(<HeroSection />);
    
    // Check main section has proper classes
    const section = container.querySelector('section');
    expect(section).toHaveClass('relative', 'min-h-screen');
  });

  it('handles responsive design elements', () => {
    render(<HeroSection />);
    
    // Check for responsive text classes
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-4xl', 'sm:text-5xl', 'lg:text-6xl');
  });
});
