import { device, element, by, expect } from 'detox';

describe('Us app happy path', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  it('signs in, hearts, and composes Us photo', async () => {
    await element(by.text('Sign In')).tap();
    await element(by.placeholder('Email')).typeText('alex@example.com');
    await element(by.placeholder('Password')).typeText('password\n');
    await expect(element(by.text('Nearby moments'))).toBeVisible();
    await element(by.label('Send heart')).atIndex(0).tap();
    await element(by.label('Send Big Heart')).atIndex(0).tap();
    await element(by.text('Likes')).tap();
    await element(by.text('Us Photo')).atIndex(0).tap();
    await expect(element(by.text('Compose an Us Photo'))).toBeVisible();
    await element(by.text('Mirror My Photo')).tap();
  });
});
