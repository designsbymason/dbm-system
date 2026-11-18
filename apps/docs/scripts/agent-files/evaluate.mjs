/**
 * Evaluates the expression inside a JSX attribute of an MDX page (`columns={["Name", "Value"]}`, `anchor="600"`,
 * `color={primitives.color.neutral.white}`) from its syntax tree, without running any code. Only literals, arrays,
 * objects, spreads of lists, plain template strings and reads from `scope` (the names the page imports from `@dbm-system/tokens`
 * and the constants it exports)
 * are understood; anything else throws, so a page that starts to compute a value fails the build instead of losing it.
 */

/** @param {any} node An ESTree expression. @param {Record<string, unknown>} scope Names a member read may start from. */
export function evaluate(node, scope = {}) {
  switch (node.type) {
    case "Literal":
      return node.value;
    case "TemplateLiteral":
      if (node.expressions.length > 0) throw new Error("a template literal with an expression is not understood");
      return node.quasis.map((quasi) => quasi.value.cooked).join("");
    case "ArrayExpression":
      return node.elements.flatMap((element) => {
        if (!element) throw new Error("an array hole is not understood");
        if (element.type !== "SpreadElement") return [evaluate(element, scope)];
        const spread = evaluate(element.argument, scope);
        if (!Array.isArray(spread)) throw new Error("a spread of something that is not a list");
        return spread;
      });
    case "ObjectExpression": {
      const out = {};
      for (const property of node.properties) {
        if (property.type !== "Property" || property.computed) throw new Error("only plain object properties are understood");
        const key = property.key.type === "Identifier" ? property.key.name : property.key.value;
        out[key] = evaluate(property.value, scope);
      }
      return out;
    }
    case "UnaryExpression":
      if (node.operator === "-" && node.argument.type === "Literal") return -node.argument.value;
      throw new Error(`the operator ${node.operator} is not understood`);
    case "Identifier":
      if (node.name === "undefined") return undefined;
      if (node.name in scope) return scope[node.name];
      throw new Error(`the name ${node.name} is not in scope`);
    case "MemberExpression": {
      const object = evaluate(node.object, scope);
      const key = node.computed ? evaluate(node.property, scope) : node.property.name;
      if (object === null || typeof object !== "object" || !(key in object)) throw new Error(`no member ${String(key)}`);
      return object[key];
    }
    default:
      throw new Error(`a ${node.type} is not understood`);
  }
}

/** The expression of a `{...}` attribute value (`mdxJsxAttributeValueExpression`). */
export function expressionOf(attributeValue) {
  const expression = attributeValue.data?.estree?.body?.[0]?.expression;
  if (!expression) throw new Error("an attribute expression has no syntax tree");
  return expression;
}
