//internal use to partial animatil weight bones
async function _setPartialAnimation(model, boneNames, newPose, lerpTime) {
    return new Promise(resolve => {
        const mixer = model.mixamo.mixer;
        const action = model.mixamo.action[newPose];
        action.play(); // Garante que a ação está ativa e pronta para ser reproduzida
        action.setEffectiveWeight(0); // Começa com peso zero para interpolar gradualmente
        // Armazena os bindings, interpolants e pesos originais se ainda não foram armazenados
        if (!action._originalState) {
            action._originalState = {
                bindings: action._propertyBindings.slice(),
                interpolants: action._interpolants.slice(),
                weights: action._propertyBindings.map(binding => binding.weight)
            };
        }
        const filteredBindings = [];
        const filteredInterpolants = [];
        const bindings = action._propertyBindings || [];
        const interpolants = action._interpolants || [];
        bindings.forEach((propertyMixer, index) => {
            const { binding } = propertyMixer;
            if (binding && binding.targetObject && boneNames.includes(binding.targetObject.name)) {
                filteredBindings.push(propertyMixer);
                filteredInterpolants.push(interpolants[index]);
            }
        });
        action._propertyBindings = filteredBindings;
        action._interpolants = filteredInterpolants;
        // Define o peso dos bindings filtrados para 1
        filteredBindings.forEach(binding => binding.weight = 0);
        // Função para interpolar o peso dos bindings
        const startTime = Date.now();
        function animateWeights() {
            const now = Date.now();
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / (lerpTime * 1000));
            // Interpolação dos pesos da nova animação
            action.setEffectiveWeight(t);
            // Interpolação dos pesos dos bindings
            filteredBindings.forEach(binding => binding.weight = t);
            if (t < 1) {
                requestAnimationFrame(animateWeights);
                // Garante que outras animações não afetem a parte superior do corpo
                mixer._actions.forEach(otherAction => {
                    if (otherAction !== action) {
                        if (!otherAction._originalState) {
                            otherAction._originalState = {
                                bindings: otherAction._propertyBindings.slice(),
                                interpolants: otherAction._interpolants.slice(),
                                weights: otherAction._propertyBindings.map(binding => binding.weight)
                            };
                        }
                        const otherBindings = otherAction._propertyBindings || [];
                        const otherInterpolants = otherAction._interpolants || [];
                        const newOtherBindings = [];
                        const newOtherInterpolants = [];
                        otherBindings.forEach((propertyMixer, index) => {
                            const { binding } = propertyMixer;
                            if (binding && binding.targetObject && !boneNames.includes(binding.targetObject.name)) {
                                newOtherBindings.push(propertyMixer);
                                newOtherInterpolants.push(otherInterpolants[index]);
                            }
                        });
                        otherAction._propertyBindings = newOtherBindings;
                        otherAction._interpolants = newOtherInterpolants;
                        // Define o peso dos bindings restantes para 1
                        newOtherBindings.forEach(binding => binding.weight = 1);
                    }
                });
            } else {
                resolve(action);
            }
        }
        animateWeights();
    });
}