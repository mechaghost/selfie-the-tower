/** 80s memorabilia icon filenames (no extension) */
export const EIGHTIES_ICONS = [
    'boombox', 'cassette', 'controller', 'crt_tv', 'disco_ball',
    'electric_guitar', 'floppy_disk', 'joystick', 'laser_gun', 'microphone',
    'pacman_ghost', 'polaroid', 'rollerskate', 'rubiks_cube', 'skateboard',
    'star', 'sunglasses', 'synth_keyboard', 'vhs', 'walkman',
];

/** Get a deterministic icon for a given index (wraps around) */
export function eightiesIcon(index: number): string {
    return `/assets/icons/${EIGHTIES_ICONS[index % EIGHTIES_ICONS.length]}.webp`;
}
