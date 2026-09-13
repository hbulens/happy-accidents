import { describe, expect, it } from 'vitest'
import { parseCommand } from '@/features/lessons/utils/commands'

describe('parseCommand', () => {
  it('recognises navigation', () => {
    expect(parseCommand('Next')).toEqual({ type: 'next' })
    expect(parseCommand('okay next step')).toEqual({ type: 'next' })
    expect(parseCommand('go back')).toEqual({ type: 'back' })
    expect(parseCommand('previous step please')).toEqual({ type: 'back' })
  })

  it('recognises repeat, tips, stop, palette, tools, finished', () => {
    expect(parseCommand('say that again')).toEqual({ type: 'repeat' })
    expect(parseCommand('Any tips?')).toEqual({ type: 'tips' })
    expect(parseCommand('stop talking')).toEqual({ type: 'stop' })
    expect(parseCommand('what colours')).toEqual({ type: 'palette' })
    expect(parseCommand('which brush')).toEqual({ type: 'tools' })
    expect(parseCommand('show the finished painting')).toEqual({ type: 'finished' })
  })

  it('jumps to a numbered step', () => {
    expect(parseCommand('go to step five')).toEqual({ type: 'goto', step: 5 })
    expect(parseCommand('jump to step 12')).toEqual({ type: 'goto', step: 12 })
  })

  it('strips the wake word before matching commands', () => {
    expect(parseCommand('hey bob next')).toEqual({ type: 'next' })
    expect(parseCommand('Bob, repeat')).toEqual({ type: 'repeat' })
  })

  it('turns wake-word sentences and question-shaped phrases into questions', () => {
    expect(parseCommand('Bob, my mountain went muddy')).toEqual({
      type: 'ask',
      question: 'my mountain went muddy',
    })
    expect(parseCommand('how much paint should I use')).toEqual({
      type: 'ask',
      question: 'how much paint should i use',
    })
  })

  it('ignores background chatter', () => {
    expect(parseCommand('')).toEqual({ type: 'ignore' })
    expect(parseCommand('the weather is nice today')).toEqual({ type: 'ignore' })
    expect(parseCommand('hey bob')).toEqual({ type: 'ignore' })
    expect(parseCommand('what')).toEqual({ type: 'ignore' })
  })
})
