import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  it('affiche le contenu et répond au clic', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Cliquez</Button>)
    const btn = screen.getByRole('button', { name: /cliquez/i })
    expect(btn).toBeInTheDocument()
    await user.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applique variant outline et size sm', () => {
    render(
      <Button variant="outline" size="sm">
        Secondaire
      </Button>
    )
    const btn = screen.getByRole('button', { name: /secondaire/i })
    expect(btn).toHaveClass('border-2', 'border-blue-deep')
  })

  it('est désactivé quand disabled', () => {
    render(<Button disabled>Désactivé</Button>)
    expect(screen.getByRole('button', { name: /désactivé/i })).toBeDisabled()
  })
})
