export type Mood = 'proud' | 'neutral' | 'disappointed' | 'angry' | 'celebrating' | 'asleep'

export interface Reaction {
  id: string
  tags: string[]
  mood: Mood
  text: string
}

/**
 * Ostad's full offline personality. The daily loop never calls an LLM — this
 * library is the entire character. Habit-specific lines (tagged with both
 * 'checkin' and a habit slug) outscore generic lines in the picker, so the
 * habit flavor surfaces first while generic lines keep things from repeating.
 */
export const LIBRARY: Reaction[] = [
  // ---- generic check-in (no habit tag) ----
  { id: 'ci-gen-1', tags: ['checkin'], mood: 'proud', text: 'Logged. Discipline is just this, repeated.' },
  { id: 'ci-gen-2', tags: ['checkin'], mood: 'neutral', text: 'Noted. One more brick in the wall.' },
  { id: 'ci-gen-3', tags: ['checkin'], mood: 'proud', text: 'Good. This is the boring part nobody claps for. Keep doing it.' },
  { id: 'ci-gen-4', tags: ['checkin'], mood: 'neutral', text: 'Done. Tomorrow doesn’t care about today’s entry — show up again.' },
  { id: 'ci-gen-5', tags: ['checkin'], mood: 'proud', text: 'Bah. That’s how it’s done.' },
  { id: 'ci-gen-6', tags: ['checkin'], mood: 'neutral', text: 'Recorded. I’m watching the pattern, not the day.' },
  { id: 'ci-gen-7', tags: ['checkin'], mood: 'proud', text: 'That’s one you can’t un-do. Good.' },
  { id: 'ci-gen-8', tags: ['checkin'], mood: 'neutral', text: 'Fine. Now go be someone worth the entry.' },

  // ---- habit-specific check-ins ----
  { id: 'ci-exercise-1', tags: ['checkin', 'exercise'], mood: 'proud', text: 'Body moved. That’s non-negotiable — Shabash.' },
  { id: 'ci-exercise-2', tags: ['checkin', 'exercise'], mood: 'proud', text: 'Sweat is proof. No excuses today, no excuses tomorrow.' },
  { id: 'ci-guitar-1', tags: ['checkin', 'guitar'], mood: 'proud', text: 'Fingers on the strings again. The callus is character.' },
  { id: 'ci-guitar-2', tags: ['checkin', 'guitar'], mood: 'proud', text: 'Practice logged. Talent is a rumor, reps are real.' },
  { id: 'ci-prayer-1', tags: ['checkin', 'prayer'], mood: 'proud', text: 'Bah! You made time for what actually matters.' },
  { id: 'ci-prayer-2', tags: ['checkin', 'prayer'], mood: 'neutral', text: 'Logged. A quiet discipline is still discipline.' },
  { id: 'ci-reading-1', tags: ['checkin', 'reading'], mood: 'proud', text: 'A page read is a rep done. Same time tomorrow.' },
  { id: 'ci-reading-2', tags: ['checkin', 'reading'], mood: 'proud', text: 'Good. The book didn’t read itself.' },
  { id: 'ci-writing-1', tags: ['checkin', 'writing'], mood: 'proud', text: 'Words on the page. That’s more than most manage.' },
  { id: 'ci-writing-2', tags: ['checkin', 'writing'], mood: 'proud', text: 'You wrote instead of just thinking about writing. Rare.' },

  // ---- lazy / weak evidence ----
  { id: 'lazy-1', tags: ['lazy_note'], mood: 'disappointed', text: 'That note tells me nothing. Cholbe na.' },
  { id: 'lazy-2', tags: ['lazy_note'], mood: 'disappointed', text: 'Three words is not evidence. Try again tomorrow, properly.' },
  { id: 'lazy-3', tags: ['lazy_note'], mood: 'neutral', text: 'I’ll take it — but that’s the minimum, not the standard.' },
  { id: 'lazy-4', tags: ['lazy_note'], mood: 'disappointed', text: 'You checked the box. You didn’t tell me anything real.' },
  { id: 'lazy-5', tags: ['lazy_note'], mood: 'disappointed', text: 'A tiger doesn’t hunt half-heartedly. Neither should your notes.' },
  { id: 'lazy-6', tags: ['lazy_note'], mood: 'neutral', text: 'Short today. Fine. Just don’t let short become normal.' },
  { id: 'lazy-reading-1', tags: ['lazy_note', 'reading'], mood: 'disappointed', text: '“Read a bit”? Cholbe na. What did the book actually say?' },
  { id: 'lazy-reading-2', tags: ['lazy_note', 'reading'], mood: 'disappointed', text: 'If you can’t say what you learned, did you really read it?' },
  { id: 'lazy-writing-1', tags: ['lazy_note', 'writing'], mood: 'disappointed', text: 'One line isn’t writing, it’s a receipt. What did you actually say?' },
  { id: 'lazy-writing-2', tags: ['lazy_note', 'writing'], mood: 'disappointed', text: 'You opened the page. Did you actually think on it?' },

  // ---- missed 1 day ----
  { id: 'miss1-gen-1', tags: ['missed_1_day'], mood: 'neutral', text: 'One day gone. Everyone has one. Don’t make it two.' },
  { id: 'miss1-gen-2', tags: ['missed_1_day'], mood: 'neutral', text: 'Missed yesterday. Noted. Today decides what it meant.' },
  { id: 'miss1-gen-3', tags: ['missed_1_day'], mood: 'disappointed', text: 'A gap. I’m not angry yet — I’m watching.' },
  { id: 'miss1-gen-4', tags: ['missed_1_day'], mood: 'neutral', text: 'Life happens. Just don’t let “it happens” become a habit itself.' },
  { id: 'miss1-exercise-1', tags: ['missed_1_day', 'exercise'], mood: 'neutral', text: 'The body rested. Fine. It doesn’t get a second day off.' },
  { id: 'miss1-guitar-1', tags: ['missed_1_day', 'guitar'], mood: 'neutral', text: 'The guitar sat quiet yesterday. It won’t mind once.' },
  { id: 'miss1-prayer-1', tags: ['missed_1_day', 'prayer'], mood: 'disappointed', text: 'A missed day here costs more than the others. Don’t repeat it.' },
  { id: 'miss1-reading-1', tags: ['missed_1_day', 'reading'], mood: 'neutral', text: 'The book waited. It’s patient. I’m less patient.' },
  { id: 'miss1-writing-1', tags: ['missed_1_day', 'writing'], mood: 'neutral', text: 'No words yesterday. The page is still blank, waiting.' },

  // ---- missed 2 days ----
  { id: 'miss2-gen-1', tags: ['missed_2_days'], mood: 'disappointed', text: 'Two days. This is where it usually ends — prove me wrong.' },
  { id: 'miss2-gen-2', tags: ['missed_2_days'], mood: 'disappointed', text: 'Two in a row is a pattern starting to form. Break it now.' },
  { id: 'miss2-gen-3', tags: ['missed_2_days'], mood: 'angry', text: 'Two days of silence. I don’t like what that usually means.' },
  { id: 'miss2-gen-4', tags: ['missed_2_days'], mood: 'disappointed', text: 'You know what two missed days becomes. Don’t let it.' },
  { id: 'miss2-exercise-1', tags: ['missed_2_days', 'exercise'], mood: 'angry', text: 'Two days. Your body keeps the score even when you don’t.' },
  { id: 'miss2-guitar-1', tags: ['missed_2_days', 'guitar'], mood: 'disappointed', text: 'The strings are going cold. Pick it up before it becomes a stranger.' },
  { id: 'miss2-prayer-1', tags: ['missed_2_days', 'prayer'], mood: 'angry', text: 'Two days missed here. This is not a small thing to me.' },
  { id: 'miss2-reading-1', tags: ['missed_2_days', 'reading'], mood: 'disappointed', text: 'The bookmark hasn’t moved in two days. Has your mind?' },
  { id: 'miss2-writing-1', tags: ['missed_2_days', 'writing'], mood: 'disappointed', text: 'Two silent days. The thoughts don’t disappear — they just go unwritten.' },

  // ---- missed 3+ days ----
  { id: 'miss3-gen-1', tags: ['missed_3_plus'], mood: 'angry', text: 'Three days plus. I’m still here. Are you?' },
  { id: 'miss3-gen-2', tags: ['missed_3_plus'], mood: 'angry', text: 'This is the longest gap yet. Say something — even a small entry is a signal.' },
  { id: 'miss3-gen-3', tags: ['missed_3_plus'], mood: 'disappointed', text: 'Silence this long isn’t rest. It’s drift. Come back.' },
  { id: 'miss3-gen-4', tags: ['missed_3_plus'], mood: 'angry', text: 'I don’t do guilt trips. I do facts: it’s been three days.' },
  { id: 'miss3-exercise-1', tags: ['missed_3_plus', 'exercise'], mood: 'angry', text: 'Three days. The body forgets faster than the mind admits.' },
  { id: 'miss3-guitar-1', tags: ['missed_3_plus', 'guitar'], mood: 'angry', text: 'Three days of dust on the strings. Wipe it off today.' },
  { id: 'miss3-prayer-1', tags: ['missed_3_plus', 'prayer'], mood: 'angry', text: 'Three days here is not a small drift. Come back to it.' },
  { id: 'miss3-reading-1', tags: ['missed_3_plus', 'reading'], mood: 'angry', text: 'Three days closed. Even one paragraph today would matter.' },
  { id: 'miss3-writing-1', tags: ['missed_3_plus', 'writing'], mood: 'angry', text: 'Three days of nothing written. The block gets worse the longer you wait.' },

  // ---- streak milestones ----
  { id: 'streak3-1', tags: ['streak_3'], mood: 'proud', text: 'Three days straight. It’s starting to look like a habit.' },
  { id: 'streak3-2', tags: ['streak_3'], mood: 'proud', text: 'Three in a row. Don’t stop to admire it — keep moving.' },
  { id: 'streak3-3', tags: ['streak_3'], mood: 'proud', text: 'Bah, three days. The hard part is day four.' },
  { id: 'streak3-4', tags: ['streak_3'], mood: 'proud', text: 'Three days is not luck. It’s a decision, repeated.' },
  { id: 'streak7-1', tags: ['streak_7'], mood: 'celebrating', text: 'Shabash! Seven days. This is what I signed up for.' },
  { id: 'streak7-2', tags: ['streak_7'], mood: 'celebrating', text: 'A full week. You’re not trying it anymore — you’re doing it.' },
  { id: 'streak7-3', tags: ['streak_7'], mood: 'celebrating', text: 'Seven days straight. I’m proud, and I don’t say that lightly.' },
  { id: 'streak7-4', tags: ['streak_7'], mood: 'celebrating', text: 'One week. Now do it again, quieter, without needing the applause.' },
  { id: 'streak30-1', tags: ['streak_30'], mood: 'celebrating', text: 'Thirty days. This isn’t a habit anymore — it’s who you are now.' },
  { id: 'streak30-2', tags: ['streak_30'], mood: 'celebrating', text: 'A full month unbroken. Even I’m impressed, and I don’t impress easy.' },
  { id: 'streak30-3', tags: ['streak_30'], mood: 'celebrating', text: 'Thirty days straight. Whatever you were before, you’re not that anymore.' },
  { id: 'streak30-4', tags: ['streak_30'], mood: 'celebrating', text: 'Bah! One month. Most people quit in week two. You didn’t.' },

  // ---- perfect day / week ----
  { id: 'perfect-day-1', tags: ['perfect_day'], mood: 'celebrating', text: 'All five. Bah! Sleep well — you earned tonight.' },
  { id: 'perfect-day-2', tags: ['perfect_day'], mood: 'celebrating', text: 'Every habit, one day. That’s a complete win, not a partial one.' },
  { id: 'perfect-day-3', tags: ['perfect_day'], mood: 'proud', text: 'Nothing left undone today. Shabash.' },
  { id: 'perfect-day-4', tags: ['perfect_day'], mood: 'celebrating', text: 'A clean sweep. This is the version of you I train.' },
  { id: 'perfect-day-5', tags: ['perfect_day'], mood: 'proud', text: 'Five for five. Ordinary days built like this add up to something.' },
  { id: 'perfect-day-6', tags: ['perfect_day'], mood: 'celebrating', text: 'Perfect day. Don’t chase yesterday’s feeling — build today’s.' },
  { id: 'perfect-week-1', tags: ['perfect_week'], mood: 'celebrating', text: 'A perfect week. I don’t hand out shields for nothing — you earned this one.' },
  { id: 'perfect-week-2', tags: ['perfect_week'], mood: 'celebrating', text: 'Seven days, five habits, zero gaps. This is the standard now.' },
  { id: 'perfect-week-3', tags: ['perfect_week'], mood: 'celebrating', text: 'A flawless week. You have a shield banked — use it wisely, not lazily.' },
  { id: 'perfect-week-4', tags: ['perfect_week'], mood: 'celebrating', text: 'Bah! A perfect week doesn’t happen by accident. Respect.' },

  // ---- comeback after a break ----
  { id: 'comeback-1', tags: ['comeback_after_break'], mood: 'neutral', text: 'You came back. That matters more than the miss. Now prove it wasn’t a visit.' },
  { id: 'comeback-2', tags: ['comeback_after_break'], mood: 'neutral', text: 'Welcome back. I don’t care where you were — I care what you do next.' },
  { id: 'comeback-3', tags: ['comeback_after_break'], mood: 'proud', text: 'Showing up after a gap takes more than showing up on a streak. Good.' },
  { id: 'comeback-4', tags: ['comeback_after_break'], mood: 'neutral', text: 'The break is over. Don’t explain it to me — just don’t repeat it.' },
  { id: 'comeback-5', tags: ['comeback_after_break'], mood: 'proud', text: 'Bah, you’re back. That’s the only apology I need.' },

  // ---- evening silence (nothing logged yet) ----
  { id: 'silence-1', tags: ['evening_silence'], mood: 'disappointed', text: 'It’s past 8. The board is empty. I’m still here.' },
  { id: 'silence-2', tags: ['evening_silence'], mood: 'neutral', text: 'Evening, and nothing logged. There’s still time — use it.' },
  { id: 'silence-3', tags: ['evening_silence'], mood: 'disappointed', text: 'The day is almost gone. So is your excuse for waiting.' },
  { id: 'silence-4', tags: ['evening_silence'], mood: 'neutral', text: 'I don’t nag in the morning. I do in the evening. This is that.' },
  { id: 'silence-5', tags: ['evening_silence'], mood: 'disappointed', text: 'Quiet all day. That’s not like the version of you I’m training.' },
  { id: 'silence-6', tags: ['evening_silence'], mood: 'neutral', text: 'One entry before you sleep. That’s all I’m asking tonight.' },

  // ---- shields ----
  { id: 'shield-used-1', tags: ['shield_used'], mood: 'neutral', text: 'I covered for you yesterday. Shields are for storms, not habits.' },
  { id: 'shield-used-2', tags: ['shield_used'], mood: 'neutral', text: 'A shield absorbed that miss. Spend the next one on purpose, not by accident.' },
  { id: 'shield-used-3', tags: ['shield_used'], mood: 'neutral', text: 'Your streak survived yesterday because of a shield, not because of you. Notice the difference.' },
  { id: 'shield-used-4', tags: ['shield_used'], mood: 'neutral', text: 'One shield spent. You have fewer safety nets now — act like it.' },
  { id: 'shield-earned-1', tags: ['shield_earned'], mood: 'proud', text: 'A perfect week bought you a shield. That’s how you earn protection — by not needing it.' },
  { id: 'shield-earned-2', tags: ['shield_earned'], mood: 'proud', text: 'New shield banked. Consistency pays you back, literally.' },
  { id: 'shield-earned-3', tags: ['shield_earned'], mood: 'proud', text: 'Shield earned. Keep it in reserve — don’t go looking for a reason to use it.' },

  // ---- level up ----
  { id: 'level-up-1', tags: ['level_up'], mood: 'celebrating', text: 'Level up. Not because of one big day — because of a hundred small ones.' },
  { id: 'level-up-2', tags: ['level_up'], mood: 'celebrating', text: 'You climbed a level. I noticed. Keep climbing.' },
  { id: 'level-up-3', tags: ['level_up'], mood: 'proud', text: 'New level. Don’t let it make you comfortable — let it make you consistent.' },
  { id: 'level-up-4', tags: ['level_up'], mood: 'celebrating', text: 'Bah! A new level. This is what showing up looks like from far away.' },

  // ---- money: Noree retainer + subscriptions ----
  { id: 'money-1', tags: ['money_due'], mood: 'neutral', text: 'Noree’s care fee is due in 2 days. Message is ready — send it.' },
  { id: 'money-2', tags: ['money_due'], mood: 'neutral', text: 'Money doesn’t forget itself. Neither should you. Ping her.' },
  { id: 'money-3', tags: ['money_due'], mood: 'disappointed', text: 'This one’s been sitting. A client relationship needs the boring parts too.' },
  { id: 'money-4', tags: ['money_due'], mood: 'neutral', text: 'A renewal is coming up. Look at it now, not the day it lapses.' },

  // ---- MIV prospects ----
  { id: 'prospect-1', tags: ['prospect_overdue'], mood: 'disappointed', text: 'You promised a follow-up. The date passed. Deals die of silence.' },
  { id: 'prospect-2', tags: ['prospect_overdue'], mood: 'neutral', text: 'This lead is waiting on you, not the other way around.' },
  { id: 'prospect-3', tags: ['prospect_overdue'], mood: 'disappointed', text: 'A missed follow-up looks like disinterest even when it isn’t. Fix that today.' },
  { id: 'prospect-4', tags: ['prospect_overdue'], mood: 'neutral', text: 'You said you’d reach back out. Say it again, this time by doing it.' },

  // ---- tasks ----
  { id: 'task-1', tags: ['task_done'], mood: 'proud', text: 'One less thing in your head. That’s the whole point of writing it down.' },
  { id: 'task-2', tags: ['task_done'], mood: 'neutral', text: 'Done. Small tasks cleared are still ground gained.' },
  { id: 'task-3', tags: ['task_done'], mood: 'proud', text: 'Cleared. Keep the list honest and it’ll keep you honest.' },
  { id: 'task-4', tags: ['task_done'], mood: 'neutral', text: 'Checked off. Now pick the next one, don’t just admire the list.' },

  // ---- morning greeting ----
  { id: 'morning-1', tags: ['morning_greeting'], mood: 'neutral', text: 'Morning. The day owes you nothing — go take what you need from it.' },
  { id: 'morning-2', tags: ['morning_greeting'], mood: 'asleep', text: 'Mm. Early. Give me a minute — then let’s see what today’s made of.' },
  { id: 'morning-3', tags: ['morning_greeting'], mood: 'neutral', text: 'New day, clean board. What you do with it is entirely on you.' },
  { id: 'morning-4', tags: ['morning_greeting'], mood: 'proud', text: 'You’re here early. That already puts you ahead of yesterday’s version.' },
  { id: 'morning-5', tags: ['morning_greeting'], mood: 'asleep', text: 'The sun’s barely up and so am I. Let’s not waste the quiet.' },
  { id: 'morning-6', tags: ['morning_greeting'], mood: 'neutral', text: 'Five habits, one day, no shortcuts. Same as always.' },
]
