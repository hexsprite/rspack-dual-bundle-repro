console.log('=== SERVER MAIN LOADED ===');

// Collection creation - will throw on second execution
import { LinksCollection } from '/imports/api/links';

// Use it to satisfy TS
void LinksCollection;
