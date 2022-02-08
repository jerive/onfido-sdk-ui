package com.onfido.qa.websdk.model;

import java.util.Objects;

public class Option {

    public final String name;
    public final String hint;
    public final String warning;
    public final boolean eStatementAccepted;

    public Option(String name, String hint, String warning, boolean eStatementAccepted) {
        this.name = name;
        this.hint = hint;
        this.warning = warning;
        this.eStatementAccepted = eStatementAccepted;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Option option = (Option) o;
        //noinspection OverlyComplexBooleanExpression
        return eStatementAccepted == option.eStatementAccepted && name.equals(option.name) && Objects.equals(hint, option.hint) && Objects.equals(warning, option.warning);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, hint, warning, eStatementAccepted);
    }
}
