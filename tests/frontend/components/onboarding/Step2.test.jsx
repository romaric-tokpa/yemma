/**
 * Tests unitaires pour Step2 (Expériences professionnelles)
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Step2 from '@/components/onboarding/Step2'

// Mock de useForm
const mockForm = {
  register: vi.fn(),
  handleSubmit: vi.fn((fn) => fn),
  watch: vi.fn((name) => {
    if (name === 'experiences') return []
    if (name?.startsWith('experiences.')) return undefined
    return []
  }),
  setValue: vi.fn(),
  formState: { errors: {} },
}

vi.mock('react-hook-form', () => ({
  useForm: () => mockForm,
}))

describe('Step2 - Expériences professionnelles', () => {
  it('devrait afficher le formulaire d\'expérience', () => {
    render(
      <Step2
        form={mockForm}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        isFirstStep={false}
        profileId={1}
      />
    )

    expect(screen.getByText(/Expériences professionnelles/i)).toBeInTheDocument()
  })

  it('devrait permettre d\'ajouter une expérience', async () => {
    render(
      <Step2
        form={mockForm}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        isFirstStep={false}
        profileId={1}
      />
    )

    const addButton = screen.getByText(/Ajouter une expérience/i)
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockForm.setValue).toHaveBeenCalled()
    })
  })

  it('devrait désactiver le champ date de fin si "En cours" est coché', async () => {
    mockForm.watch.mockImplementation((name) => {
      if (name === 'experiences') return [{ isCurrent: true }]
      if (name === 'experiences.0.isCurrent') return true
      return undefined
    })

    render(
      <Step2
        form={mockForm}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        isFirstStep={false}
        profileId={1}
      />
    )

    const endDateInput = screen.getByLabelText(/Date de fin/i)
    expect(endDateInput).toBeDisabled()
  })
})
