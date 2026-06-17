import { safeMerge, isPlainObject } from '../../primitives/src/safe-merge';
import { isSafeUrl, sanitizeUrl } from '../../primitives/src/safe-url';

describe('safeMerge — prototype pollution (threat T5)', () => {
  it('drops __proto__ and does not pollute Object.prototype', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
    const result = safeMerge<Record<string, unknown>>({}, malicious);
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    expect(Object.prototype.hasOwnProperty('polluted')).toBe(false);
    expect((result as Record<string, unknown>)['polluted']).toBeUndefined();
  });

  it('drops constructor / prototype keys', () => {
    const malicious = JSON.parse('{"constructor": {"prototype": {"x": 1}}}');
    const result = safeMerge<Record<string, unknown>>({ keep: 1 }, malicious);
    expect((result as Record<string, unknown>)['keep']).toBe(1);
    expect(({} as Record<string, unknown>)['x']).toBeUndefined();
  });

  it('deep-merges plain objects without mutating inputs', () => {
    const base: Record<string, unknown> = { a: { x: 1 }, b: 2 };
    const out = safeMerge(base, { a: { y: 9 } });
    expect(out).toEqual({ a: { x: 1, y: 9 }, b: 2 });
    expect(base).toEqual({ a: { x: 1 }, b: 2 }); // untouched
  });

  it('isPlainObject rejects arrays and class instances', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(null)).toBe(false);
  });
});

describe('isSafeUrl / sanitizeUrl — XSS + open-redirect (threats T4/T9)', () => {
  it('blocks dangerous schemes', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('  javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>x</script>')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
  });

  it('blocks protocol-relative URLs (open redirect)', () => {
    expect(isSafeUrl('//evil.com')).toBe(false);
  });

  it('allows safe absolute + relative URLs', () => {
    expect(isSafeUrl('https://example.com/x')).toBe(true);
    expect(isSafeUrl('mailto:a@b.com')).toBe(true);
    expect(isSafeUrl('tel:+15551234')).toBe(true);
    expect(isSafeUrl('/dashboard')).toBe(true);
    expect(isSafeUrl('reports?year=2026#top')).toBe(true);
  });

  it('sanitizeUrl falls back for unsafe input', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
    expect(sanitizeUrl('https://ok.com')).toBe('https://ok.com');
  });
});
