import { LegalDocument } from './legal-document';

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  updated: 'November 20, 2026',
  intro:
    'Pokémon DraftZone ("DraftZone", "we") is a fan-made site for running and tracking Pokémon draft leagues. This policy explains what we collect, why, who can see it, and how to delete it.',
  sections: [
    {
      id: 'collect',
      label: 'What We Collect',
      blocks: [
        {
          kind: 'p',
          text: 'Signing in. We use Auth0 to sign you in with Google, Discord, or an email and password. Auth0 holds your sign-in details, including your email address and, for email accounts, your password. DraftZone receives an account identifier, the name your sign-in provider gives us, and when you signed in. We do not store your email address or password on our servers.',
        },
        {
          kind: 'p',
          text: 'Your account. Your display name, site settings (theme, sprite style and similar), whether your profile is private, the date you joined and the date you last signed in.',
        },
        {
          kind: 'p',
          text: 'League details you give us. Your Showdown name and timezone, the coach and team names you choose, team logos you upload, and your answers on league sign-up forms.',
        },
        {
          kind: 'p',
          text: 'A connected Discord account. If you connect Discord, or sign in with it, we keep your Discord user ID and username. We ask Discord for nothing else: not your email, your servers or your messages.',
        },
        {
          kind: 'p',
          text: 'What you create. Drafts, match results, planner plans, teams, tier lists, chat messages in tournaments, and reports you send about chat messages.',
        },
        {
          kind: 'p',
          text: 'Prizes. If you win a prize from a league or promotion we run, we ask for what we need to deliver it, such as your name and shipping address. We use it only to deliver the prize and delete it once that is done. If you pay an entry fee for an event we run, the payment service handles your payment details; we see only what it shows us, such as your name and the amount.',
        },
        {
          kind: 'p',
          text: 'Uploaded images. When you upload an image we record which account uploaded it and the IP address it came from, so we can deal with abuse.',
        },
        {
          kind: 'p',
          text: 'Technical data. We use Amazon CloudWatch RUM to measure page speed and catch errors; it records the pages you visit, your browser and device type, and errors you run into. When something breaks, an error report with the page address and your browser type is sent to our team. Our server sees your IP address with each request and uses it to limit abuse; apart from uploads, it is not stored.',
        },
        {
          kind: 'p',
          text: "Browser storage. We keep your sign-in session, settings and planner plans in your browser's local storage so the site works between visits. We use no advertising or tracking cookies. Auth0 sets its own cookies on its sign-in page to keep you signed in.",
        },
      ],
    },
    {
      id: 'use',
      label: 'How We Use It',
      blocks: [
        {
          kind: 'list',
          items: [
            'To run the site: your drafts, leagues, plans and settings.',
            'To show your name and teams to the people in your leagues.',
            'To let our Discord bot mention you in league servers for draft turns, match reminders and coach roles, when you have connected Discord.',
            'To stop abuse and to find and fix bugs.',
          ],
        },
        {
          kind: 'p',
          text: 'We do not sell your information, show ads, or build profiles of you for anyone else.',
        },
      ],
    },
    {
      id: 'visibility',
      label: 'Who Can See What',
      blocks: [
        {
          kind: 'list',
          items: [
            'Anyone: your public profile (display name, completed seasons and achievements) unless you turn on Private Profile, and the team names, coach names, timezones, rosters and results in tournaments that are public.',
            'Organizers of a tournament you sign up for: your sign-up answers, including your Showdown name, timezone and Discord name. Sign-ups may also be posted to the league\'s own Discord channel.',
            'Organizers and coaches in a tournament you coach in: your connected Discord name, so they can reach you.',
            'Anything you choose to share, such as a tier list or a matchup link.',
          ],
        },
        {
          kind: 'p',
          text: 'We share data with the services that run DraftZone: Auth0 for sign-in, Amazon Web Services for hosting, image storage and error tracking, our database host, and Discord for the bot. They handle it only to provide their service to us. We will also disclose information if the law requires it.',
        },
      ],
    },
    {
      id: 'retention',
      label: 'How Long We Keep It',
      blocks: [
        {
          kind: 'p',
          text: 'We keep your information while your account exists. When you delete your account, it is removed 30 days later (see below). Backups of our database may hold it for up to 90 days more before they are discarded.',
        },
        {
          kind: 'p',
          text: "Seasons you played in other people's leagues stay, so their standings and results still make sense. Your team, picks, results and the coach name you used in that tournament remain, but they are no longer linked to an account, and your Discord name, Showdown name and timezone are removed from them.",
        },
      ],
    },
    {
      id: 'choices',
      label: 'Your Choices',
      blocks: [
        {
          kind: 'list',
          items: [
            'Change your display name, Showdown name, timezone and Private Profile in Settings.',
            'Connect or disconnect Discord in Settings.',
            'Delete your account in Settings. It is removed after 30 days, and signing back in before then lets you cancel.',
            'Ask us for a copy of your data, or to correct or delete it, by email. We answer within 30 days.',
          ],
        },
        {
          kind: 'p',
          text: 'Depending on where you live, you may have further rights over your data, such as objecting to how it is used or complaining to a data protection authority. Contact us and we will help.',
        },
      ],
    },
    {
      id: 'children',
      label: 'Children',
      blocks: [
        {
          kind: 'p',
          text: 'You must be at least 13 to use DraftZone. If we learn that an account belongs to someone younger, we will delete it.',
        },
      ],
    },
    {
      id: 'security',
      label: 'Security and Location',
      blocks: [
        {
          kind: 'p',
          text: 'All traffic to DraftZone is encrypted, and sign-in is handled by Auth0 so we never hold passwords. Our servers are in the United States, so your information is stored and processed there.',
        },
      ],
    },
    {
      id: 'changes',
      label: 'Changes',
      blocks: [
        {
          kind: 'p',
          text: 'If we change this policy we will update it here and change the date at the top. For significant changes we will also post a notice on the site.',
        },
      ],
    },
    {
      id: 'contact',
      label: 'Contact',
      blocks: [
        {
          kind: 'contact',
          text: 'Questions, data requests and deletion requests:',
        },
      ],
    },
  ],
};
