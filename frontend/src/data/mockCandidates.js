// Générateur de données mockées pour la démo CVthèque
// Génère plus de 1000 profils de candidats variés

const SECTORS = [
  'Technologie & Informatique',
  'Finance & Comptabilité',
  'Marketing & Communication',
  'Ressources Humaines',
  'Commerce & Vente',
  'Logistique & Supply Chain',
  'Ingénierie & Technique',
  'Santé & Social',
  'Éducation & Formation',
  'Juridique & Droit',
  'Immobilier',
  'Tourisme & Hôtellerie',
  'Agriculture & Agroalimentaire',
  'Énergie & Environnement',
  'Design & Architecture',
  'Consulting & Conseil',
  'Média & Édition',
  'Transport & Mobilité',
  'Assurance',
  'Banque & Finance'
]

const FIRST_NAMES = [
  'Sophie', 'Jean', 'Marie', 'Pierre', 'Camille', 'Thomas', 'Léa', 'Nicolas',
  'Julie', 'Antoine', 'Emma', 'Lucas', 'Clara', 'Hugo', 'Manon', 'Alexandre',
  'Sarah', 'Maxime', 'Laura', 'Julien', 'Amélie', 'Romain', 'Pauline', 'Vincent',
  'Amadou', 'Fatou', 'Ibrahima', 'Aissatou', 'Moussa', 'Kadiatou', 'Ousmane', 'Mariama',
  'Youssef', 'Aicha', 'Mehdi', 'Nadia', 'Karim', 'Sanaa', 'Bilal', 'Zineb',
  'David', 'Rachel', 'Michael', 'Sarah', 'Daniel', 'Esther', 'Jonathan', 'Rebecca'
]

const LAST_NAMES = [
  'Martin', 'Dupont', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand',
  'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux',
  'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupuis', 'Lambert',
  'Diallo', 'Traoré', 'Sall', 'Ndiaye', 'Ba', 'Diop', 'Fall', 'Kane',
  'Benali', 'Alaoui', 'Bennani', 'Idrissi', 'Amrani', 'Bouazza', 'Cherkaoui', 'El Amrani',
  'Cohen', 'Levy', 'Benhamou', 'Azoulay', 'Bensaid', 'Mekki', 'Hamdi', 'Khelifi'
]

const JOBS_BY_SECTOR = {
  'Technologie & Informatique': [
    'Développeur Full-Stack', 'Développeur Frontend', 'Développeur Backend',
    'Ingénieur DevOps', 'Data Scientist', 'Data Analyst', 'Architecte Solutions',
    'Chef de Projet IT', 'Product Manager', 'Scrum Master', 'Développeur Mobile',
    'Ingénieur Cloud', 'Cybersecurity Engineer', 'Machine Learning Engineer',
    'QA Engineer', 'Tech Lead', 'CTO', 'Développeur Python', 'Développeur Java',
    'Développeur JavaScript', 'DBA', 'Network Engineer'
  ],
  'Finance & Comptabilité': [
    'Comptable', 'Expert-Comptable', 'Contrôleur de Gestion', 'Analyste Financier',
    'Directeur Financier', 'Trésorier', 'Auditeur', 'Conseiller Financier',
    'Gestionnaire de Paie', 'Assistant Comptable', 'Responsable Comptable',
    'Analyste Crédit', 'Gestionnaire de Portefeuille'
  ],
  'Marketing & Communication': [
    'Chef de Projet Marketing', 'Responsable Communication', 'Community Manager',
    'Digital Marketing Manager', 'SEO Specialist', 'Content Manager',
    'Brand Manager', 'Marketing Analyst', 'Public Relations Manager',
    'Social Media Manager', 'Marketing Automation Specialist'
  ],
  'Ressources Humaines': [
    'Responsable RH', 'Recruteur', 'Gestionnaire de Paie', 'Formateur',
    'Chargé de Recrutement', 'Responsable Formation', 'HR Business Partner',
    'Talent Acquisition Specialist', 'Compensation & Benefits Manager'
  ],
  'Commerce & Vente': [
    'Commercial', 'Business Developer', 'Account Manager', 'Sales Manager',
    'Key Account Manager', 'Chargé de Clientèle', 'Responsable Commercial',
    'Business Analyst', 'Sales Representative', 'Trade Marketing Manager'
  ],
  'Logistique & Supply Chain': [
    'Responsable Logistique', 'Supply Chain Manager', 'Acheteur',
    'Planificateur', 'Responsable Entrepôt', 'Logisticien', 'Transport Manager',
    'Procurement Manager', 'Inventory Manager'
  ],
  'Ingénierie & Technique': [
    'Ingénieur Civil', 'Ingénieur Mécanique', 'Ingénieur Électrique',
    'Ingénieur Industriel', 'Ingénieur Qualité', 'Ingénieur Process',
    'Ingénieur R&D', 'Ingénieur Projet', 'Ingénieur Maintenance'
  ],
  'Santé & Social': [
    'Infirmier', 'Aide-soignant', 'Assistant Social', 'Éducateur Spécialisé',
    'Psychologue', 'Kinésithérapeute', 'Ergothérapeute', 'Diététicien',
    'Sage-femme', 'Ambulancier'
  ],
  'Éducation & Formation': [
    'Professeur', 'Formateur', 'Enseignant', 'Conseiller Pédagogique',
    'Directeur d\'École', 'Coordinateur Pédagogique', 'Animateur',
    'Éducateur', 'Tuteur'
  ],
  'Juridique & Droit': [
    'Avocat', 'Juriste', 'Notaire', 'Huissier de Justice', 'Conseiller Juridique',
    'Paralegal', 'Legal Advisor', 'Compliance Officer'
  ],
  'Immobilier': [
    'Agent Immobilier', 'Gestionnaire de Patrimoine', 'Promoteur Immobilier',
    'Expert Immobilier', 'Chargé de Clientèle Immobilier', 'Syndic'
  ],
  'Tourisme & Hôtellerie': [
    'Réceptionniste', 'Chef de Cuisine', 'Serveur', 'Directeur d\'Hôtel',
    'Guide Touristique', 'Responsable Événementiel', 'Concierge',
    'Chef de Rang', 'Sommelier'
  ],
  'Agriculture & Agroalimentaire': [
    'Ingénieur Agronome', 'Technicien Agricole', 'Responsable Qualité Agroalimentaire',
    'Chef de Production', 'Responsable R&D Agroalimentaire', 'Vétérinaire'
  ],
  'Énergie & Environnement': [
    'Ingénieur Énergies Renouvelables', 'Ingénieur Environnement', 'Technicien Énergie',
    'Responsable QHSE', 'Ingénieur Électricité', 'Chargé de Mission Environnement'
  ],
  'Design & Architecture': [
    'Architecte', 'Designer UX/UI', 'Designer Graphique', 'Designer Produit',
    'Architecte d\'Intérieur', 'Designer Web', 'Illustrateur', 'Motion Designer'
  ],
  'Consulting & Conseil': [
    'Consultant', 'Senior Consultant', 'Manager Consulting', 'Conseil en Stratégie',
    'Conseil en Organisation', 'Conseil en Transformation', 'Business Analyst'
  ],
  'Média & Édition': [
    'Journaliste', 'Rédacteur', 'Éditeur', 'Photographe', 'Vidéaste',
    'Monteur Vidéo', 'Graphiste', 'Chef de Rubrique'
  ],
  'Transport & Mobilité': [
    'Chauffeur', 'Conducteur de Train', 'Pilote', 'Responsable Transport',
    'Logisticien Transport', 'Dispatcher', 'Contrôleur'
  ],
  'Assurance': [
    'Courtier en Assurance', 'Conseiller en Assurance', 'Expert en Sinistres',
    'Responsable Commercial Assurance', 'Actuaire', 'Gestionnaire de Sinistres'
  ],
  'Banque & Finance': [
    'Conseiller Clientèle', 'Chargé d\'Affaires', 'Analyste Crédit',
    'Gestionnaire de Portefeuille', 'Trader', 'Compliance Officer',
    'Responsable Agence', 'Conseiller en Gestion de Patrimoine'
  ]
}

const SKILLS_BY_JOB = {
  'Développeur Full-Stack': ['React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL'],
  'Développeur Frontend': ['React', 'Vue.js', 'Angular', 'TypeScript', 'CSS'],
  'Développeur Backend': ['Node.js', 'Python', 'Java', 'PostgreSQL', 'MongoDB'],
  'Ingénieur DevOps': ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'Jenkins'],
  'Data Scientist': ['Python', 'TensorFlow', 'SQL', 'Pandas', 'Machine Learning'],
  'Product Manager': ['Product Strategy', 'Agile', 'Data Analysis', 'UX Research'],
  'Comptable': ['Sage', 'Excel', 'Comptabilité Générale', 'Fiscalité', 'Paie'],
  'Commercial': ['Vente', 'Négociation', 'CRM', 'Relation Client', 'Prospection'],
  'Chef de Projet': ['Agile', 'Scrum', 'Project Management', 'Jira', 'Gestion d\'équipe'],
  'Designer UX/UI': ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
  'Marketing Manager': ['Marketing Digital', 'SEO', 'SEM', 'Social Media', 'Analytics']
}

const LOCATIONS = [
  'Abidjan, Côte d\'Ivoire',
  'Yamoussoukro, Côte d\'Ivoire',
  'Bouaké, Côte d\'Ivoire',
  'Daloa, Côte d\'Ivoire',
  'San-Pédro, Côte d\'Ivoire',
  'Korhogo, Côte d\'Ivoire',
  'Man, Côte d\'Ivoire',
  'Divo, Côte d\'Ivoire',
  'Gagnoa, Côte d\'Ivoire',
  'Abengourou, Côte d\'Ivoire',
  'Anyama, Côte d\'Ivoire',
  'Bingerville, Côte d\'Ivoire',
  'Grand-Bassam, Côte d\'Ivoire',
  'Jacqueville, Côte d\'Ivoire',
  'Tiassalé, Côte d\'Ivoire',
  'Agboville, Côte d\'Ivoire',
  'Adzopé, Côte d\'Ivoire',
  'Bondoukou, Côte d\'Ivoire',
  'Odienné, Côte d\'Ivoire',
  'Katiola, Côte d\'Ivoire',
  'Séguéla, Côte d\'Ivoire',
  'Bouaflé, Côte d\'Ivoire',
  'Sinfra, Côte d\'Ivoire',
  'Vavoua, Côte d\'Ivoire',
  'Zuénoula, Côte d\'Ivoire',
  'Oumé, Côte d\'Ivoire',
  'Issia, Côte d\'Ivoire',
  'Guiglo, Côte d\'Ivoire',
  'Toumodi, Côte d\'Ivoire',
  'Dimbokro, Côte d\'Ivoire'
]

const AVAILABILITIES = ['immediate', 'within_1_month', 'within_2_months', 'within_3_months', 'after_3_months']

// Fonction pour générer un nombre aléatoire entre min et max
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// Fonction pour sélectionner un élément aléatoire dans un tableau
const randomItem = (array) => array[randomInt(0, array.length - 1)]

// Fonction pour générer un score admin réaliste
const generateAdminScore = () => {
  const rand = Math.random()
  if (rand < 0.1) return parseFloat((Math.random() * 1.5 + 2.5).toFixed(1)) // 10% entre 2.5-4.0
  if (rand < 0.3) return parseFloat((Math.random() * 0.5 + 4.0).toFixed(1)) // 20% entre 4.0-4.5
  if (rand < 0.7) return parseFloat((Math.random() * 0.5 + 4.5).toFixed(1)) // 40% entre 4.5-5.0
  return parseFloat((Math.random() * 0.3 + 4.7).toFixed(1)) // 30% entre 4.7-5.0
}

// Fonction pour générer des compétences selon le métier
const generateSkills = (job) => {
  const baseSkills = SKILLS_BY_JOB[job] || ['Compétence 1', 'Compétence 2', 'Compétence 3']
  const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
  
  return baseSkills.map(skill => ({
    name: skill,
    level: randomItem(levels)
  }))
}

// Fonction pour générer un résumé professionnel
const generateSummary = (firstName, job, experience, sector) => {
  const summaries = [
    `${job} avec ${experience} ans d'expérience dans le secteur ${sector}. Passionné(e) par l'excellence et l'innovation.`,
    `Professionnel(le) expérimenté(e) en ${job} avec ${experience} ans d'expérience. Expertise reconnue dans ${sector}.`,
    `${job} dynamique avec ${experience} ans d'expérience. Spécialisé(e) dans ${sector} avec une approche orientée résultats.`,
    `Expert(e) en ${job} avec ${experience} ans d'expérience dans ${sector}. Fort(e) de compétences techniques et relationnelles.`,
    `${job} avec ${experience} ans d'expérience. Passionné(e) par ${sector} et toujours en quête d'excellence professionnelle.`
  ]
  return randomItem(summaries)
}

// Fonction pour générer un rapport admin
const generateAdminReport = (adminScore) => {
  const technical = parseFloat((adminScore - 0.3 + Math.random() * 0.6).toFixed(1))
  const soft = parseFloat((adminScore - 0.2 + Math.random() * 0.4).toFixed(1))
  const communication = parseFloat((adminScore - 0.2 + Math.random() * 0.4).toFixed(1))
  const motivation = parseFloat((adminScore - 0.1 + Math.random() * 0.2).toFixed(1))
  
  const strengths = [
    'Expertise technique solide',
    'Excellente communication',
    'Leadership naturel',
    'Autonomie et proactivité',
    'Rigueur et organisation',
    'Créativité et innovation',
    'Esprit d\'équipe',
    'Adaptabilité'
  ]
  
  const recommendations = [
    'Idéal pour des projets complexes',
    'Peut gérer des équipes',
    'Excellent pour l\'innovation',
    'Très motivé et aligné',
    'Peut former les juniors'
  ]
  
  return {
    overall_score: adminScore,
    technical_skills_rating: Math.min(5, Math.max(0, technical)),
    soft_skills_rating: Math.min(5, Math.max(0, soft)),
    communication_rating: Math.min(5, Math.max(0, communication)),
    motivation_rating: Math.min(5, Math.max(0, motivation)),
    summary: `Candidat(e) avec un score global de ${adminScore}/5. ${adminScore >= 4.5 ? 'Excellent profil avec une expertise reconnue.' : adminScore >= 4.0 ? 'Très bon profil avec des compétences solides.' : 'Bon profil avec du potentiel.'}`,
    strengths: [randomItem(strengths), randomItem(strengths), randomItem(strengths)].filter((v, i, a) => a.indexOf(v) === i),
    recommendations: [randomItem(recommendations), randomItem(recommendations)].filter((v, i, a) => a.indexOf(v) === i)
  }
}

// Fonction principale pour générer un candidat
const generateCandidate = (id) => {
  const sector = randomItem(SECTORS)
  const jobs = JOBS_BY_SECTOR[sector] || ['Professionnel']
  const job = randomItem(jobs)
  const firstName = randomItem(FIRST_NAMES)
  const lastName = randomItem(LAST_NAMES)
  const fullName = `${firstName} ${lastName}`
  const experience = randomInt(0, 20)
  const adminScore = generateAdminScore()
  const skills = generateSkills(job)
  
  // Ajouter quelques compétences supplémentaires aléatoires
  const additionalSkills = [
    'Communication', 'Leadership', 'Gestion de projet', 'Travail d\'équipe',
    'Analyse', 'Résolution de problèmes', 'Créativité', 'Adaptabilité'
  ]
  const extraSkills = Array.from({ length: randomInt(1, 3) }, () => ({
    name: randomItem(additionalSkills),
    level: randomItem(['INTERMEDIATE', 'ADVANCED'])
  }))
  
  const allSkills = [...skills, ...extraSkills]
  
  return {
    candidate_id: id,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    title: job,
    main_job: job,
    profile_title: job,
    summary: generateSummary(firstName, job, experience, sector),
    summary_highlight: generateSummary(firstName, job, experience, sector).replace(
      new RegExp(`(${job}|${sector})`, 'gi'),
      '<mark>$1</mark>'
    ),
    location: randomItem(LOCATIONS),
    years_of_experience: experience,
    total_experience: experience,
    availability: randomItem(AVAILABILITIES),
    admin_score: adminScore,
    is_verified: true,
    status: 'VALIDATED',
    skills: allSkills,
    sector: sector,
    photo_url: null,
    admin_report: generateAdminReport(adminScore)
  }
}

// Générer 1200 candidats pour avoir une bonne variété
export const MOCK_CANDIDATES = Array.from({ length: 1200 }, (_, i) => generateCandidate(i + 1))
