#!/bin/bash
# Script pour exécuter tous les tests backend
# Certains tests doivent être exécutés séparément pour éviter les conflits d'imports

echo "=========================================="
echo "Exécution des tests backend"
echo "=========================================="
echo ""

# Tests de completion (nécessite service candidate)
echo "1. Tests de completion..."
pytest tests/backend/test_completion.py -v
COMPLETION_EXIT=$?

echo ""
echo "2. Tests de validateurs (nécessite service document)..."
pytest tests/backend/test_validators.py -v
VALIDATORS_EXIT=$?

echo ""
echo "3. Autres tests backend..."
pytest tests/backend/ \
    --ignore=tests/backend/test_validators.py \
    --ignore=tests/backend/test_completion.py \
    -v
OTHER_EXIT=$?

echo ""
echo "=========================================="
echo "Résumé"
echo "=========================================="
echo "Tests completion: $([ $COMPLETION_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "Tests validateurs: $([ $VALIDATORS_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "Autres tests: $([ $OTHER_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"

# Retourner un code d'erreur si un des tests a échoué
if [ $COMPLETION_EXIT -ne 0 ] || [ $VALIDATORS_EXIT -ne 0 ] || [ $OTHER_EXIT -ne 0 ]; then
    exit 1
fi

exit 0
