'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {toast} from "@/hooks/use-toast"
import {Icons} from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
  SubstituteIngredientInput,
  substituteIngredient,
} from '@/ai/flows/substitute-ingredient';
import {suggestRecipes, SuggestRecipesInput, SuggestRecipesOutput} from '@/ai/flows/suggest-recipes';

export default function Home() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState<SuggestRecipesOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [substituteIngredientInput, setSubstituteIngredientInput] = useState({
    recipeName: '',
    originalIngredient: '',
    availableIngredients: '',
  });
  const [substituteIngredientLoading, setSubstituteIngredientLoading] = useState(false);
  const [substitutionResults, setSubstitutionResults] = useState<any | null>(null);
  const [open, setOpen] = useState(false)

  const handleIngredientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIngredients(e.target.value);
  };

  const suggest = async () => {
    setLoading(true);
    try {
      const ingredientsArray = ingredients.split(',').map(item => item.trim());
      const input: SuggestRecipesInput = {ingredients: ingredientsArray};
      const recipeSuggestions = await suggestRecipes(input);
      setRecipes(recipeSuggestions);
    } catch (error: any) {
      console.error('Error generating recipes:', error);
      toast({
        title: "Uh oh! Something went wrong.",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  };

  const handleSubstituteIngredient = async () => {
    setSubstituteIngredientLoading(true);
    try {
      const availableIngredientsArray = substituteIngredientInput.availableIngredients.split(',').map(item => item.trim());

      const input: SubstituteIngredientInput = {
        recipeName: substituteIngredientInput.recipeName,
        originalIngredient: substituteIngredientInput.originalIngredient,
        availableIngredients: availableIngredientsArray,
      };
      const substitution = await substituteIngredient(input);
      setSubstitutionResults(substitution);
      console.log("Substitution results:", substitution);
    } catch (error: any) {
      console.error('Error substituting ingredient:', error);
      toast({
        title: "Uh oh! Something went wrong.",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubstituteIngredientLoading(false);
      setOpen(false);
    }
  };

  const handleOpenSubstituteDialog = (recipe: any) => {
    setSelectedRecipe(recipe);
    setSubstituteIngredientInput({
      recipeName: recipe.name,
      originalIngredient: '',
      availableIngredients: '',
    });
    setOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-background">
      <h1 className="text-3xl font-bold mb-4 text-primary">FridgeChef</h1>
      <Input
        type="text"
        placeholder="أدخل المكونات مفصولة بفواصل"
        className="w-full max-w-md mb-2"
        value={ingredients}
        onChange={handleIngredientChange}
      />
      <Button onClick={suggest} disabled={loading}>
        {loading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
            جاري الاقتراح...
          </>
        ) : (
          'اقتراح وصفات'
        )}
      </Button>

      {recipes && recipes.recipes.length > 0 ? (
        <div className="mt-4 w-full max-w-4xl">
          <h2 className="text-2xl font-semibold mb-2 text-primary">الوصفات المقترحة</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recipes.recipes.map((recipe, index) => (
              <Card key={index} className="shadow-md">
                <CardHeader>
                  <CardTitle>{recipe.name}</CardTitle>
                  <CardDescription>وصفة سهلة الاتباع</CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-1">المكونات:</h3>
                  <ul className="list-disc list-inside mb-2">
                    {recipe.ingredients.map((ingredient, i) => (
                      <li key={i}>{ingredient}</li>
                    ))}
                  </ul>
                  <h3 className="text-lg font-semibold mb-1">التعليمات:</h3>
                  <Textarea
                    value={recipe.instructions}
                    readOnly
                    className="min-h-[100px] resize-none"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenSubstituteDialog(recipe)}
                    className="mt-2 w-full"
                  >
                    استبدال المكون
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : recipes ? (
        <div className="mt-4">لم يتم العثور على وصفات للمكونات المحددة.</div>
      ) : null}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">تعديل التفضيلات</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استبدال المكون</AlertDialogTitle>
            <AlertDialogDescription>
              أدخل المكون الذي تريد استبداله والمكونات المتاحة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right font-medium">
                المكون الأصلي
              </label>
              <Input
                id="originalIngredient"
                value={substituteIngredientInput.originalIngredient}
                onChange={(e) =>
                  setSubstituteIngredientInput({
                    ...substituteIngredientInput,
                    originalIngredient: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="username" className="text-right font-medium">
                المكونات المتاحة
              </label>
              <Input
                id="availableIngredients"
                value={substituteIngredientInput.availableIngredients}
                onChange={(e) =>
                  setSubstituteIngredientInput({
                    ...substituteIngredientInput,
                    availableIngredients: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubstituteIngredient} disabled={substituteIngredientLoading}>
              {substituteIngredientLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
                  جاري الاستبدال...
                </>
              ) : (
                'استبدال'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {substitutionResults && (
        <Card className="mt-4 w-full max-w-md">
          <CardHeader>
            <CardTitle>نتائج الاستبدال</CardTitle>
            <CardDescription>البدائل المقترحة والأسباب</CardDescription>
          </CardHeader>
          <CardContent>
            {substitutionResults.suggestedSubstitutes.length > 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-1">البدائل المقترحة:</h3>
                <ul className="list-disc list-inside mb-2">
                  {substitutionResults.suggestedSubstitutes.map((substitute, i) => (
                    <li key={i}>{substitute}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p>لم يتم العثور على بدائل مناسبة.</p>
            )}
            <h3 className="text-lg font-semibold mb-1">الأسباب:</h3>
            <Textarea value={substitutionResults.reasoning} readOnly className="min-h-[80px] resize-none"/>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
