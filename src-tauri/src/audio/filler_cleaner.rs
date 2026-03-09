use log::debug;
use once_cell::sync::Lazy;
use regex::Regex;

/// Regex matching French filler words (non-ambiguous only).
/// Matches: euh, euuh, euhh, heu, heuu, hum, hmm, hmmm, mm, mmm, bah, ben, ah, oh
/// Only matches on word boundaries to avoid partial matches.
static FILLER_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?iu)\b(?:e+u+h+|h+e+u+h*|h+[um]+m+|m{2,}|bah|ben|[ao]h)\b")
        .expect("Failed to compile filler regex")
});

/// Regex matching consecutive duplicate words (case-insensitive).
/// Captures the first occurrence and matches one or more repetitions.
static REPEAT_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?iu)\b(\w+)(?:\s+\1)+\b").expect("Failed to compile repeat regex")
});

/// Regex matching multiple consecutive spaces.
static MULTI_SPACE_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r" {2,}").expect("Failed to compile multi-space regex")
});

/// Removes French filler words and consecutive word repetitions from transcribed text.
pub fn clean_fillers(text: &str) -> String {
    if text.trim().is_empty() {
        return text.to_string();
    }

    // 1. Remove filler words
    let cleaned = FILLER_RE.replace_all(text, "");

    // 2. Remove consecutive duplicate words: "je je vais" -> "je vais"
    let cleaned = REPEAT_RE.replace_all(&cleaned, "$1");

    // 3. Collapse multiple spaces
    let cleaned = MULTI_SPACE_RE.replace_all(&cleaned, " ");

    let result = cleaned.trim().to_string();

    if result != text.trim() {
        debug!(
            "Filler cleaner: \"{}\" -> \"{}\"",
            text.trim(),
            result
        );
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn removes_euh() {
        assert_eq!(clean_fillers("je euh vais bien"), "je vais bien");
    }

    #[test]
    fn removes_euh_variants() {
        assert_eq!(clean_fillers("euuh voilà"), "voilà");
        assert_eq!(clean_fillers("euhh bon"), "bon");
    }

    #[test]
    fn removes_heu() {
        assert_eq!(clean_fillers("heu je pense que"), "je pense que");
    }

    #[test]
    fn removes_hum_hmm() {
        assert_eq!(clean_fillers("hum c'est bien"), "c'est bien");
        assert_eq!(clean_fillers("hmm d'accord"), "d'accord");
        assert_eq!(clean_fillers("hmmm oui"), "oui");
    }

    #[test]
    fn removes_mm() {
        assert_eq!(clean_fillers("mm je sais"), "je sais");
        assert_eq!(clean_fillers("mmm oui"), "oui");
    }

    #[test]
    fn removes_bah_ben() {
        assert_eq!(clean_fillers("bah oui"), "oui");
        assert_eq!(clean_fillers("ben je sais pas"), "je sais pas");
    }

    #[test]
    fn removes_ah_oh() {
        assert_eq!(clean_fillers("ah je vois"), "je vois");
        assert_eq!(clean_fillers("oh c'est bien"), "c'est bien");
    }

    #[test]
    fn removes_repeated_words() {
        assert_eq!(clean_fillers("je je vais bien"), "je vais bien");
        assert_eq!(clean_fillers("le le le chat"), "le chat");
    }

    #[test]
    fn removes_fillers_and_repeats_combined() {
        assert_eq!(
            clean_fillers("euh je je vais euh bien"),
            "je vais bien"
        );
    }

    #[test]
    fn case_insensitive() {
        assert_eq!(clean_fillers("Euh je vais bien"), "je vais bien");
        assert_eq!(clean_fillers("HUM d'accord"), "d'accord");
    }

    #[test]
    fn preserves_normal_text() {
        assert_eq!(clean_fillers("je vais bien"), "je vais bien");
    }

    #[test]
    fn handles_empty_input() {
        assert_eq!(clean_fillers(""), "");
        assert_eq!(clean_fillers("   "), "");
    }

    #[test]
    fn does_not_remove_partial_matches() {
        // "heure" contains "heu" but should NOT be affected
        assert_eq!(clean_fillers("une heure plus tard"), "une heure plus tard");
        // "bénéfice" contains "ben" but should NOT be affected
        assert_eq!(clean_fillers("le bénéfice est là"), "le bénéfice est là");
    }

    #[test]
    fn collapses_spaces() {
        assert_eq!(clean_fillers("je  euh  vais"), "je vais");
    }

    #[test]
    fn handles_multiple_fillers() {
        assert_eq!(
            clean_fillers("euh hum je euh pense que hmm oui"),
            "je pense que oui"
        );
    }
}
