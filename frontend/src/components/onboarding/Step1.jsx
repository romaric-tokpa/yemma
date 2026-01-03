import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function Step1({ form, onNext, onPrevious, isFirstStep }) {
  const { register, handleSubmit, formState: { errors } } = form

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input id="firstName" {...register('firstName')} />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input id="lastName" {...register('lastName')} />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date de naissance *</Label>
          <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
          {errors.dateOfBirth && (
            <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationality">Nationalité *</Label>
          <Input id="nationality" {...register('nationality')} />
          {errors.nationality && (
            <p className="text-sm text-destructive">{errors.nationality.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input id="phone" type="tel" {...register('phone')} />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">Adresse / Ville *</Label>
          <Input id="address" {...register('address')} />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville *</Label>
          <Input id="city" {...register('city')} />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Pays *</Label>
          <Input id="country" {...register('country')} />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="profileTitle">Titre du profil *</Label>
          <Input id="profileTitle" {...register('profileTitle')} />
          {errors.profileTitle && (
            <p className="text-sm text-destructive">{errors.profileTitle.message}</p>
          )}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="professionalSummary">Résumé professionnel (min. 300 caractères) *</Label>
          <Textarea 
            id="professionalSummary" 
            rows={5}
            {...register('professionalSummary')} 
          />
          {errors.professionalSummary && (
            <p className="text-sm text-destructive">{errors.professionalSummary.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">Secteur(s) d'activité *</Label>
          <Input id="sector" {...register('sector')} />
          {errors.sector && (
            <p className="text-sm text-destructive">{errors.sector.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mainJob">Métier principal *</Label>
          <Input id="mainJob" {...register('mainJob')} />
          {errors.mainJob && (
            <p className="text-sm text-destructive">{errors.mainJob.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalExperience">Années d'expérience totale *</Label>
          <Input id="totalExperience" type="number" min="0" {...register('totalExperience', { valueAsNumber: true })} />
          {errors.totalExperience && (
            <p className="text-sm text-destructive">{errors.totalExperience.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        {!isFirstStep && (
          <Button type="button" variant="outline" onClick={onPrevious}>
            Précédent
          </Button>
        )}
        <Button type="submit" className="ml-auto">
          Suivant
        </Button>
      </div>
    </form>
  )
}

