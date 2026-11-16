// Emberfall — screenshot staging helper.
// Reads ?shot=title|play|power|over from the URL and puts the game into
// that state so screenshots show each screen of the real game.
// Harmless in normal play: with no ?shot param the game opens on the
// title screen, exactly as usual. Collisions are disabled while a shot
// state is staged so the staged scene survives until the screenshot.

export function applyShot(game) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot || shot === 'title') return;
  game.shotMode = true;

  if (shot === 'play') {
    game.startGame();
    game.setScore(1250);
    game.setCombo(7, 60);
    game.setElapsed(30);
    game.player.x = 640;
    game.player.y = 560;
    game.embers.spawnAt(520, 300);
    game.embers.spawnAt(600, 220);
    game.embers.spawnAt(700, 340);
    game.embers.spawnAt(770, 180);
    game.embers.spawnAt(430, 160);
    game.embers.spawnAt(880, 300);
    game.meteors.spawnAt(300, 200, 'rock', 170);
    game.meteors.spawnAt(980, 140, 'rock', 190);
    game.meteors.spawnAt(1120, 320, 'wisp', 120);
    game.meteors.spawnAt(180, 420, 'rock', 150);
    game.particles.burst(640, 520, '255, 180, 70', 18, 200);
  } else if (shot === 'power') {
    game.startGame();
    game.setScore(3420);
    game.setCombo(12, 60);
    game.setElapsed(55);
    game.player.x = 640;
    game.player.y = 580;
    game.powerups.activate('shield', game.now);
    game.powerups.activate('magnet', game.now);
    game.powerups.spawnAt(820, 260, 'slow');
    game.embers.spawnAt(560, 420);
    game.embers.spawnAt(620, 360);
    game.embers.spawnAt(700, 430);
    game.embers.spawnAt(760, 330);
    game.embers.spawnAt(500, 300);
    game.embers.spawnAt(840, 420);
    game.embers.spawnAt(900, 300);
    game.meteors.spawnAt(260, 220, 'rock', 180);
    game.meteors.spawnAt(1060, 180, 'wisp', 130);
    game.meteors.spawnAt(1120, 420, 'rock', 170);
    game.particles.burst(640, 540, '77, 227, 255', 22, 240);
    game.particles.burst(700, 470, '255, 180, 70', 16, 200);
  } else if (shot === 'over') {
    game.startGame();
    game.setScore(2480);
    game.setElapsed(95);
    game.forceGameOver();
  }
}
