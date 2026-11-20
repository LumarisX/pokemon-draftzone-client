import { LegalDocument } from './legal-document';

export const TERMS_OF_SERVICE: LegalDocument = {
  title: 'Terms of Service',
  updated: 'November 20, 2026',
  intro:
    'These terms apply to your use of Pokémon DraftZone ("DraftZone", "we"). By using the site you agree to them. If you do not agree, please do not use DraftZone.',
  sections: [
    {
      id: 'eligibility',
      label: 'Who Can Use DraftZone',
      blocks: [
        {
          kind: 'p',
          text: 'You must be at least 13. If you are under the age of majority where you live, you need a parent or guardian\'s permission.',
        },
      ],
    },
    {
      id: 'account',
      label: 'Your Account',
      blocks: [
        {
          kind: 'p',
          text: 'An account is for one person. You are responsible for what happens under it, so keep your sign-in secure and tell us if you think someone else has used it. Do not use an account to pretend to be someone else.',
        },
      ],
    },
    {
      id: 'content',
      label: 'Your Content',
      blocks: [
        {
          kind: 'p',
          text: 'What you make on DraftZone (teams, logos, plans, tier lists, messages) stays yours. You give us permission to store it and show it as the site needs to: to you, to the people in your leagues, and to the public where a page is public. That permission ends when you delete the content or your account, except for seasons in other people\'s leagues, which stay as described in the Privacy Policy.',
        },
        {
          kind: 'p',
          text: 'Only upload images and text you have the right to use.',
        },
      ],
    },
    {
      id: 'leagues',
      label: 'Leagues and Organizers',
      blocks: [
        {
          kind: 'p',
          text: 'Leagues are run by their organizers. Organizers set the rules, settle disputes and decide who takes part, and we are not responsible for their decisions. When DraftZone runs a league of its own, it acts as that league\'s organizer under these same terms.',
        },
        {
          kind: 'p',
          text: 'Organizers see the details coaches give when signing up. Use them only to run your league.',
        },
      ],
    },
    {
      id: 'prizes',
      label: 'Prizes and Promotions',
      blocks: [
        {
          kind: 'p',
          text: 'Leagues run by other organizers. DraftZone does not offer, collect, hold or deliver prizes, entry fees or any other payments for leagues it does not run, and makes no promise about how another organizer charges, spends or pays out money. Any such arrangement is solely between you and that organizer, and DraftZone is not responsible for it. The rest of this section applies only to leagues and promotions DraftZone runs itself.',
        },
        {
          kind: 'p',
          text: 'Leagues and promotions run by DraftZone. We sometimes run our own leagues, tournaments and giveaways, with prizes such as items from our shop, and some of our leagues may charge an entry fee. Each event has its own posted rules, which apply together with these terms and say who can enter, how winners are decided, what the prize is, and any entry fee, before you enter. For every DraftZone event:',
        },
        {
          kind: 'list',
          items: [
            'a giveaway never requires a purchase or donation to enter or win',
            'every entry fee goes to that event\'s prizes and the direct cost of delivering them, such as shipping; DraftZone keeps none of it',
            'paid events are contests of skill, decided by drafting and match results, not by chance',
            'if a paid event is cancelled before it starts, entry fees are refunded in full; otherwise refunds follow the event\'s rules',
            'events are void where the law prohibits them, and a paid event\'s rules list any places it cannot accept entries from',
          ],
        },
        {
          kind: 'p',
          text: 'Unless an event\'s rules say otherwise, prizes have no cash value and cannot be exchanged or transferred, we may substitute a prize of equal or greater value if the original is unavailable, a winner who cannot be reached or does not claim a prize within 30 days may lose it, and winners are responsible for any taxes or import fees on their prize. We may disqualify anyone who breaks an event\'s rules or these terms, and may change or cancel an event if something outside our control stops it from running fairly.',
        },
      ],
    },
    {
      id: 'conduct',
      label: 'Conduct',
      blocks: [
        { kind: 'p', text: 'Do not:' },
        {
          kind: 'list',
          items: [
            'harass, threaten or abuse anyone, or post hateful or sexual content',
            'pretend to be another person or organizer',
            'tamper with drafts, results or other people\'s accounts',
            'post spam or advertising outside the places meant for it',
            'scrape the site, overload it, or try to get around its security',
            'use DraftZone for anything illegal',
          ],
        },
      ],
    },
    {
      id: 'moderation',
      label: 'Moderation',
      blocks: [
        {
          kind: 'p',
          text: 'Organizers can remove messages in their tournaments. We can remove content, and lock or delete accounts, that break these terms. You can report a chat message from the message itself.',
        },
      ],
    },
    {
      id: 'pokemon',
      label: 'Pokémon',
      blocks: [
        {
          kind: 'p',
          text: 'DraftZone is a fan project. It is not affiliated with, endorsed or sponsored by Nintendo, Creatures Inc., GAME FREAK inc. or The Pokémon Company. Pokémon and Pokémon character names are trademarks of their respective owners.',
        },
      ],
    },
    {
      id: 'support',
      label: 'Donations and the Shop',
      blocks: [
        {
          kind: 'p',
          text: 'Donations are voluntary and do not buy any feature, service or special treatment. The DraftZone shop is a separate site with its own terms.',
        },
      ],
    },
    {
      id: 'warranty',
      label: 'No Warranty',
      blocks: [
        {
          kind: 'p',
          text: 'DraftZone is free and provided "as is". We work to keep it running and your data safe, but we cannot promise it will always be available, error-free, or keep every feature. We may change or end features at any time.',
        },
        {
          kind: 'p',
          text: 'As far as the law allows, DraftZone is not liable for indirect or consequential losses, or for lost data, from using or being unable to use the site.',
        },
      ],
    },
    {
      id: 'ending',
      label: 'Ending Your Use',
      blocks: [
        {
          kind: 'p',
          text: 'You can stop using DraftZone and delete your account at any time in Settings. We may suspend or end your access if you break these terms.',
        },
      ],
    },
    {
      id: 'changes',
      label: 'Changes',
      blocks: [
        {
          kind: 'p',
          text: 'We may update these terms. We will change the date at the top, and post a notice on the site for significant changes. Using DraftZone after a change means you accept it.',
        },
      ],
    },
    {
      id: 'contact',
      label: 'Contact',
      blocks: [{ kind: 'contact', text: 'Questions about these terms:' }],
    },
  ],
};
