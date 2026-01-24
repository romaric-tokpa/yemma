/**
 * Tests unitaires pour Step5 (Compétences)
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Step5 from '@/components/onboarding/Step5'

// Mock de useForm
const mockForm = {
  register: vi.fn(),
  handleSubmit: vi.fn((fn) => fn),
  watch: vi.fn((name) => {
    if (name === 'technicalSkills') return []
    if (name === 'softSkills') return []
    return []
  }),
  setValue: vi.fn(),
  formState: { errors: {} },
}

vi.mock('react-hook-form', () => ({
  useForm: () => mockForm,
}))

describe('Step5 - Compétences', () => {
  it('devrait afficher les sections pour compétences techniques et soft skills', () => {
    render(
      <Step5
        form={mockForm}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        isFirstStep={false}
      />
    )

    expect(screen.getByText(/Compétences techniques/i)).toBeInTheDocument()
    expect(screen.getByText(/Compétences comportementales/i)).toBeInTheDocument()
  })

  it('devrait permettre d\'ajouter une compétence technique', async () => {
    const { container } = render(
      <Step5
        form={mockForm}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        isFirstStep={false}
      />
    )

    const addButton = screen.getByText(/Ajouter une compétence technique/i)
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockForm.setValue).toHaveBeenCalled()
    })
  })

  it('devrait permettre d\'ajouter une soft skill', async () => {
    render(
      <Step5
        form={mockForm}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        isFirstStep={false}
      />
    )

    const input = screen.getByPlaceholderText(/Ajouter une compétence comportementale/i)
    fireEvent.change(input, { target: { value: 'Communication' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(mockForm.setValue).toHaveBeenCalled()
    })
  })
})
