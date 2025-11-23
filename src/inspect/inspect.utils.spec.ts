import { getDopplerPhase, getFadePercentage, isBlueGem, isFadeSkin } from './inspect.utils';

describe('Inspect Utils', () => {
    describe('getDopplerPhase', () => {
        it('should return correct phase for known paint indexes', () => {
            expect(getDopplerPhase(415)).toBe('Ruby');
            expect(getDopplerPhase(416)).toBe('Sapphire');
            expect(getDopplerPhase(418)).toBe('Phase 1');
        });

        it('should return null for unknown paint indexes', () => {
            expect(getDopplerPhase(999)).toBeNull();
        });
    });

    describe('isFadeSkin', () => {
        it('should return true for known fade paint indexes', () => {
            expect(isFadeSkin(38)).toBe(true);
            expect(isFadeSkin(246)).toBe(true);
        });

        it('should return false for other paint indexes', () => {
            expect(isFadeSkin(1)).toBe(false);
        });
    });

    describe('getFadePercentage', () => {
        it('should return percentage for valid weapon and seed', () => {
            // Seed 763 is often 100% or high fade
            const percentage = getFadePercentage('Karambit', 763);
            expect(percentage).toBeGreaterThan(0);
        });

        it('should return 0 for invalid weapon', () => {
            const percentage = getFadePercentage('InvalidWeapon', 123);
            expect(percentage).toBe(0);
        });
    });

    describe('isBlueGem', () => {
        it('should return true for known blue gem seeds', () => {
            // AK-47 (7) seed 661
            expect(isBlueGem(7, 661)).toBe(true);
        });

        it('should return false for unknown seeds', () => {
            expect(isBlueGem(7, 123)).toBe(false);
        });
    });
});
